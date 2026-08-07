import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  canonicalJson,
  collectContentArtifacts,
  remainingFixtureFingerprintCount,
  sha256,
  sha256Json,
} from "./lib/artifact-binding.mjs";
import { authorizedContentApprovalSource } from "./lib/content-approval.mjs";
import { validateJson } from "./lib/schema.mjs";

function argument(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const owner = argument("--owner");
const sourceReference = argument("--source-reference");
const approvedAt = argument("--approved-at");
const sourceKind = argument("--source-kind") || "client";

if (!owner || !sourceReference || !approvedAt) {
  console.error(
    "Usage: pnpm content:bind -- --owner <name> --source-reference <reference> --approved-at <ISO timestamp> [--source-kind client|repository|website|document]",
  );
  process.exit(2);
}
if (!["client", "repository", "website", "document"].includes(sourceKind)) {
  throw new Error(`Unsupported content source kind: ${sourceKind}`);
}
if (Number.isNaN(Date.parse(approvedAt))) {
  throw new Error("--approved-at must be an ISO date-time.");
}

const repositoryRoot = process.cwd();
const generationPath = path.join(
  repositoryRoot,
  "foundation",
  "generation-record.json",
);
const runtimePath = path.join(
  repositoryRoot,
  "foundation",
  "runtime-contract.json",
);
const configPath = path.join(
  repositoryRoot,
  "app",
  "src",
  "config",
  "generated-site.json",
);
const manifestPath = path.join(
  repositoryRoot,
  "foundation",
  "content-manifest.json",
);

const generation = validateJson(
  generationPath,
  "generation-record.schema.json",
);
const brief = validateJson(
  path.join(repositoryRoot, "foundation", "site-brief.json"),
  "site-brief.schema.json",
);
const runtime = validateJson(runtimePath, "runtime-contract.schema.json");
const approvedAuthority = authorizedContentApprovalSource(brief, {
  owner,
  sourceKind,
  sourceReference,
});
const remaining = remainingFixtureFingerprintCount(repositoryRoot, generation);
if (remaining > 0) {
  throw new Error(
    `${remaining} original fixture content fingerprints remain; replace all fixture copy before recording approval.`,
  );
}

const generatedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const currentBriefSha256 = sha256(canonicalJson(brief));
generatedConfig.contentStatus = "approved";
generatedConfig.briefSha256 = currentBriefSha256;
generatedConfig.identityName =
  brief.business.identity.value || brief.project.workingTitle;
fs.writeFileSync(configPath, canonicalJson(generatedConfig));

const manifest = {
  schemaVersion: "1.0",
  status: "approved",
  fixtureId: null,
  testimonials: brief.content.testimonials,
  artifacts: collectContentArtifacts(repositoryRoot),
  approval: {
    status: "approved",
    owner,
    approvedAt,
    source: approvedAuthority,
  },
};
fs.writeFileSync(manifestPath, canonicalJson(manifest));
validateJson(manifestPath, "content-manifest.schema.json");

runtime.runtime.contentBinding = "approved";
runtime.runtime.contentManifestSha256 = sha256Json(manifest);
runtime.brief.sha256 = currentBriefSha256;
runtime.runtime.identityName =
  brief.business.identity.value || brief.project.workingTitle;
runtime.runtime.testimonialState = brief.content.testimonials;
fs.writeFileSync(runtimePath, canonicalJson(runtime));
validateJson(runtimePath, "runtime-contract.schema.json");

console.log(`Bound approved content manifest: ${manifestPath}`);
