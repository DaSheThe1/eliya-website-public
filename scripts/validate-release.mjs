import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { collectReleaseFindings } from "./lib/release.mjs";
import { collectPairedReleaseFindings } from "./lib/paired-release.mjs";
import { repositoryRoot, validateJson } from "./lib/schema.mjs";

const briefArgument = process.argv[2];

if (!briefArgument) {
  console.error("Usage: pnpm release:check -- <site-brief.json>");
  process.exit(2);
}

const brief = validateJson(
  path.resolve(briefArgument),
  "site-brief.schema.json",
);
const requiredBindings = [
  ["foundation/runtime-contract.json", "runtime-contract.schema.json"],
  ["foundation/generation-record.json", "generation-record.schema.json"],
  ["foundation/content-manifest.json", "content-manifest.schema.json"],
];
for (const [relativePath, schema] of requiredBindings) {
  const documentPath = path.join(repositoryRoot, relativePath);
  if (!fs.existsSync(documentPath)) {
    console.error(`Release is blocked: ${relativePath} is required.`);
    process.exit(1);
  }
  validateJson(documentPath, schema);
}
const staticWorkerReceiptPath = path.join(
  repositoryRoot,
  "foundation",
  "static-worker-receipt.json",
);
if (
  brief.deployment.profile === "static-pages-worker" &&
  brief.integrations.intake.mode !== "none"
) {
  const pairedReleasePath = path.join(
    repositoryRoot,
    "foundation",
    "paired-provider-release.json",
  );
  if (!fs.existsSync(pairedReleasePath)) {
    console.error(
      "Release is blocked: foundation/paired-provider-release.json is required.",
    );
    process.exit(1);
  }
  const pairedRelease = validateJson(
    pairedReleasePath,
    "paired-provider-release.schema.json",
  );
  const workerConfigPath = path.join(repositoryRoot, "worker", "wrangler.jsonc");
  if (!fs.existsSync(workerConfigPath)) {
    console.error("Release is blocked: worker/wrangler.jsonc is required.");
    process.exit(1);
  }
  const pairedFindings = collectPairedReleaseFindings({
    brief,
    manifest: pairedRelease,
    workerConfig: JSON.parse(fs.readFileSync(workerConfigPath, "utf8")),
    repositoryRoot,
  });
  if (pairedFindings.length > 0) {
    console.error("Release is blocked:");
    for (const finding of pairedFindings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }
}
if (fs.existsSync(staticWorkerReceiptPath)) {
  validateJson(
    staticWorkerReceiptPath,
    "static-worker-receipt.schema.json",
  );
}
const runtime = JSON.parse(
  fs.readFileSync(
    path.join(repositoryRoot, "foundation/runtime-contract.json"),
    "utf8",
  ),
);
const receiptPath = path.join(
  repositoryRoot,
  "app",
  runtime.runtime.deploymentProfile === "static-pages-worker"
    ? "out"
    : ".next",
  ".foundation-build-receipt.json",
);
if (fs.existsSync(receiptPath)) {
  validateJson(receiptPath, "build-receipt.schema.json");
}
const findings = collectReleaseFindings(brief, repositoryRoot);

if (findings.length > 0) {
  console.error("Release is blocked:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("Release brief contains no unresolved release blockers.");
