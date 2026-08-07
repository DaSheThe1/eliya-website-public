import path from "node:path";
import process from "node:process";

import { collectRuntimeBindingFindings } from "./lib/runtime-binding.mjs";
import { validateJson } from "./lib/schema.mjs";

const briefPath = path.resolve(
  process.argv[2] || "foundation/site-brief.json",
);
const runtimePath = path.resolve(
  process.argv[3] || "foundation/runtime-contract.json",
);
const repositoryRoot = path.dirname(path.dirname(runtimePath));

const brief = validateJson(briefPath, "site-brief.schema.json");
const runtime = validateJson(runtimePath, "runtime-contract.schema.json");
const generationRecord = validateJson(
  path.join(repositoryRoot, "foundation", "generation-record.json"),
  "generation-record.schema.json",
);
const contentManifest = validateJson(
  path.join(repositoryRoot, "foundation", "content-manifest.json"),
  "content-manifest.schema.json",
);
const findings = collectRuntimeBindingFindings({
  brief,
  runtime,
  generationRecord,
  contentManifest,
  repositoryRoot,
});

if (findings.length > 0) {
  console.error("Runtime contract mismatch:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`Validated runtime binding: ${runtimePath}`);
