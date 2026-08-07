import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  artifactFileDigests,
  canonicalJson,
  sha256,
  sha256Json,
} from "./lib/artifact-binding.mjs";
import { resolveBuildSourceIdentity } from "./lib/build-source.mjs";
import { validateJson } from "./lib/schema.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const runtimePath = path.join(
  repositoryRoot,
  "foundation",
  "runtime-contract.json",
);
const contentManifestPath = path.join(
  repositoryRoot,
  "foundation",
  "content-manifest.json",
);
const packagePath = path.join(repositoryRoot, "package.json");

for (const requiredPath of [runtimePath, contentManifestPath, packagePath]) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Build receipt input is missing: ${requiredPath}`);
  }
}

const source = resolveBuildSourceIdentity(repositoryRoot);

const runtime = validateJson(runtimePath, "runtime-contract.schema.json");
validateJson(contentManifestPath, "content-manifest.schema.json");
const packageDocument = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const isStatic =
  runtime.runtime.deploymentProfile === "static-pages-worker";
const artifactRoot = path.join(
  repositoryRoot,
  "app",
  isStatic ? "out" : ".next",
);
const expectedMarker = isStatic
  ? path.join(artifactRoot, "index.html")
  : path.join(artifactRoot, "BUILD_ID");
if (!fs.existsSync(expectedMarker)) {
  throw new Error("Production build output is missing its expected marker.");
}

const receiptName = ".foundation-build-receipt.json";
const files = artifactFileDigests(artifactRoot, receiptName);
const receipt = {
  schemaVersion: "1.0",
  source,
  version: packageDocument.version,
  runtimeContractSha256: sha256(fs.readFileSync(runtimePath)),
  contentManifestSha256: sha256(fs.readFileSync(contentManifestPath)),
  buildInputs: {
    basePath: runtime.runtime.basePath,
    defaultLocale: runtime.runtime.defaultLocale,
    deploymentProfile: runtime.runtime.deploymentProfile,
    enabledModules: runtime.runtime.enabledModules,
    siteUrl: runtime.runtime.siteUrl,
  },
  artifact: {
    sha256: sha256Json(files),
    files,
  },
};
const receiptPath = path.join(artifactRoot, receiptName);
fs.writeFileSync(receiptPath, canonicalJson(receipt));
validateJson(receiptPath, "build-receipt.schema.json");
console.log(`Wrote production build receipt: ${receiptPath}`);
