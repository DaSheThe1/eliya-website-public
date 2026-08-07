import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  copyRailPosition,
  evaluateMotionEligibility,
  nativeScrollProgress,
  resolveSettleTarget,
  touchIntentThreshold,
} from "../modules/motion-native-scroll-story/reference.mjs";
import { repositoryRoot, validateJson } from "./lib/schema.mjs";

test("the reviewed native-scroll example satisfies the strict contract", () => {
  const examplePath = path.join(
    repositoryRoot,
    "modules",
    "motion-native-scroll-story",
    "example.contract.json",
  );
  const validated = validateJson(
    examplePath,
    "motion-native-scroll-story.schema.json",
  );
  assert.equal(validated.eligibility.ignoreOsReducedMotion, true);

  const invalid = structuredClone(validated);
  invalid.eligibility.ignoreOsReducedMotion = false;
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "motion-contract-"),
  );
  const target = path.join(directory, "invalid.json");
  try {
    fs.writeFileSync(target, `${JSON.stringify(invalid, null, 2)}\n`);
    assert.throws(
      () => validateJson(target, "motion-native-scroll-story.schema.json"),
      /constant|must be equal to constant/i,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("the site choice is the motion gate and the OS signal is not an input", () => {
  assert.deepEqual(
    evaluateMotionEligibility({ siteMotion: "reduced" }),
    { eligible: false, reason: "site-opt-out" },
  );
  assert.deepEqual(
    evaluateMotionEligibility({
      siteMotion: "motion",
      osReducedMotion: true,
    }),
    { eligible: true, reason: "eligible" },
  );
});

test("Save-Data blocks heavy media but not lightweight selected motion", () => {
  assert.deepEqual(
    evaluateMotionEligibility(
      { saveData: true },
      { heavyMedia: true },
    ),
    { eligible: false, reason: "save-data" },
  );
  assert.equal(
    evaluateMotionEligibility(
      { saveData: true },
      { heavyMedia: false },
    ).eligible,
    true,
  );
});

test("cursor effects require a fine pointer and stop while hidden", () => {
  assert.equal(
    evaluateMotionEligibility(
      { finePointer: false },
      { pointerEffect: true },
    ).reason,
    "no-fine-pointer",
  );
  assert.equal(
    evaluateMotionEligibility({ documentVisible: false }).reason,
    "document-hidden",
  );
});

test("native scroll maps continuously and copy rests between transitions", () => {
  assert.equal(
    nativeScrollProgress({
      trackTop: -150,
      trackHeight: 400,
      stageHeight: 100,
    }),
    0.5,
  );
  assert.equal(copyRailPosition(0, 4), 0);
  assert.equal(copyRailPosition(1, 4), 3);
  assert.ok(Math.abs(copyRailPosition(0.5, 4) - 1.5) < 0.000_001);
});

test("phone intent threshold stays within the reviewed bounded range", () => {
  assert.equal(touchIntentThreshold(500), 42);
  assert.equal(touchIntentThreshold(844), 50.64);
  assert.equal(touchIntentThreshold(1_400), 64);
});

test("one deliberate touch advances at most one station", () => {
  assert.deepEqual(
    resolveSettleTarget({
      stationCount: 4,
      startStation: 1,
      startScrollY: 500,
      endScrollY: 1_500,
      rawProgress: 0.9,
      viewportHeight: 844,
    }),
    { kind: "station", station: 2 },
  );
  assert.deepEqual(
    resolveSettleTarget({
      stationCount: 4,
      startStation: 2,
      startScrollY: 800,
      endScrollY: 728,
      rawProgress: 0.3,
      viewportHeight: 844,
    }),
    { kind: "station", station: 1 },
  );
});

test("tiny movement uses the nearest station", () => {
  assert.deepEqual(
    resolveSettleTarget({
      stationCount: 4,
      startStation: 1,
      startScrollY: 500,
      endScrollY: 520,
      rawProgress: 0.58,
      viewportHeight: 844,
    }),
    { kind: "station", station: 2 },
  );
});

test("endpoint and completed reverse gestures return native page control", () => {
  assert.deepEqual(
    resolveSettleTarget({
      stationCount: 4,
      startStation: 0,
      startScrollY: 500,
      endScrollY: 420,
      rawProgress: -0.05,
      viewportHeight: 844,
    }),
    { kind: "native-exit" },
  );
  assert.deepEqual(
    resolveSettleTarget({
      stationCount: 4,
      startStation: 3,
      startScrollY: 1_500,
      endScrollY: 300,
      rawProgress: -0.2,
      viewportHeight: 844,
    }),
    { kind: "native-exit" },
  );
});
