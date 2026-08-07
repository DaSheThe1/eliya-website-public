import path from "node:path";

import {
  generationRecordHistoryFindings,
  sha256Json,
} from "./lib/artifact-binding.mjs";
import { collectModuleReadinessFindings } from "./lib/module-readiness.mjs";
import { repositoryRoot, validateJson } from "./lib/schema.mjs";

const generationRecord = validateJson(
  path.join(repositoryRoot, "foundation", "generation-record.json"),
  "generation-record.schema.json",
);
const runtime = validateJson(
  path.join(repositoryRoot, "foundation", "runtime-contract.json"),
  "runtime-contract.schema.json",
);
const findings = generationRecordHistoryFindings(repositoryRoot);
if (runtime.runtime.generationRecordSha256 !== sha256Json(generationRecord)) {
  findings.push("runtime generation record digest does not match");
}
findings.push(
  ...collectModuleReadinessFindings({
    repositoryRoot,
    generationRecord,
    enabledModules: runtime.runtime.enabledModules,
  }),
);

if (findings.length > 0) {
  console.error("Preview and release are blocked by module readiness:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("Selected modules have exact implementation and passing validation.");
