import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Json(value) {
  return sha256(canonicalJson(value));
}

const fixtureSourceTextExtensions = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".less",
  ".md",
  ".mdx",
  ".mjs",
  ".mts",
  ".sass",
  ".scss",
  ".svg",
  ".ts",
  ".tsx",
]);
const productionFixtureTextFilePattern = "**/*.{js,json,html,css,svg}";
const fixtureIdentityMarkers = ["Northstar", "נורת׳סטאר"];

function normalizedTokens(value) {
  return value
    .normalize("NFKC")
    .replaceAll(/\\u\{([0-9a-f]+)\}/gi, (_match, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    )
    .replaceAll(/\\u([0-9a-f]{4})/gi, (_match, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    )
    .replaceAll(/\\(?:n|r|t)/g, " ")
    .replaceAll(/<[^>]*>/g, " ")
    .toLocaleLowerCase("en")
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

function signatureForTokens(tokens) {
  return {
    sha256: sha256(tokens.join(" ")),
    tokenCount: tokens.length,
  };
}

export function fixtureContentSignature(value) {
  const tokens = normalizedTokens(value);
  if (tokens.length < 1) {
    throw new Error("Fixture signatures require visible text.");
  }
  return signatureForTokens(tokens);
}

function signatureKey(signature) {
  return `${signature.tokenCount}:${signature.sha256}`;
}

function regularFilesUnder(directory, label) {
  if (!fs.existsSync(directory)) return [];
  const rootStat = fs.lstatSync(directory);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(`${label} must be a regular directory, not a symbolic link.`);
  }

  const files = [];
  const visit = (currentDirectory, relativeDirectory = "") => {
    const entries = fs
      .readdirSync(currentDirectory)
      .sort((left, right) => left.localeCompare(right));
    for (const name of entries) {
      const absolutePath = path.join(currentDirectory, name);
      const relativePath = relativeDirectory
        ? path.posix.join(relativeDirectory, name)
        : name;
      const stat = fs.lstatSync(absolutePath);
      if (stat.isSymbolicLink()) {
        throw new Error(
          `${label} must not contain symbolic links: ${relativePath}`,
        );
      }
      if (stat.isDirectory()) {
        visit(absolutePath, relativePath);
      } else if (stat.isFile()) {
        files.push(relativePath);
      } else {
        throw new Error(
          `${label} must contain only regular files and directories: ${relativePath}`,
        );
      }
    }
  };
  visit(directory);
  return files;
}

function applicationSourcePaths(repositoryRoot) {
  return regularFilesUnder(
    path.join(repositoryRoot, "app", "src"),
    "Application source",
  );
}

function publicAssetPaths(repositoryRoot) {
  return regularFilesUnder(
    path.join(repositoryRoot, "app", "public"),
    "Public assets",
  );
}

export function contentArtifactPaths(repositoryRoot) {
  const sourceFiles = applicationSourcePaths(repositoryRoot).map((file) =>
    path.posix.join("app/src", file),
  );
  const publicFiles = publicAssetPaths(repositoryRoot).map((file) =>
    path.posix.join("app/public", file),
  );
  return [...sourceFiles, ...publicFiles].sort();
}

export function collectContentArtifacts(repositoryRoot) {
  return contentArtifactPaths(repositoryRoot).map((relativePath) => ({
    path: relativePath,
    sha256: sha256(fs.readFileSync(path.join(repositoryRoot, relativePath))),
  }));
}

function visibleStringLiterals(source) {
  const values = [];
  for (const stringLiteral of [
    /"((?:\\.|[^"\\])*)"/g,
    /'((?:\\.|[^'\\])*)'/g,
    /`((?:\\.|[^`\\])*)`/g,
  ]) {
    for (const match of source.matchAll(stringLiteral)) {
      const value = match[1]
        .replaceAll("\\n", " ")
        .replaceAll("\\t", " ")
        .replaceAll(/\s+/g, " ")
        .trim();
      if (
        value.length >= 16 &&
        (/[\s\u0590-\u05ff]/u.test(value)) &&
        !value.startsWith("@/") &&
        !value.startsWith("./") &&
        !value.startsWith("../")
      ) {
        values.push(value);
      }
    }
  }
  return values;
}

function collectFixtureSignatures(directory, pattern) {
  if (!fs.existsSync(directory)) return [];
  const signatures = new Map();
  for (const relativePath of fs.globSync(pattern, {
    cwd: directory,
  })) {
    const source = fs.readFileSync(path.join(directory, relativePath), "utf8");
    for (const value of visibleStringLiterals(source)) {
      const tokens = normalizedTokens(value);
      if (tokens.length < 3) continue;
      const signature = fixtureContentSignature(value);
      signatures.set(signatureKey(signature), signature);
    }
    for (const marker of fixtureIdentityMarkers) {
      if (!source.includes(marker)) continue;
      const signature = fixtureContentSignature(marker);
      signatures.set(signatureKey(signature), signature);
    }
  }
  return [...signatures.values()].sort(
    (left, right) =>
      left.tokenCount - right.tokenCount ||
      left.sha256.localeCompare(right.sha256),
  );
}

function signaturesPresentInPaths(directory, relativePaths, baselineSignatures) {
  const signaturesByLength = new Map();
  for (const signature of baselineSignatures) {
    const entries = signaturesByLength.get(signature.tokenCount) ?? new Map();
    entries.set(signature.sha256, signatureKey(signature));
    signaturesByLength.set(signature.tokenCount, entries);
  }

  const present = new Set();
  for (const relativePath of relativePaths) {
    const absolutePath = path.join(directory, relativePath);
    if (!fs.statSync(absolutePath).isFile()) continue;
    const tokens = normalizedTokens(fs.readFileSync(absolutePath, "utf8"));
    for (const [tokenCount, expected] of signaturesByLength) {
      if (tokens.length < tokenCount) continue;
      for (let index = 0; index <= tokens.length - tokenCount; index += 1) {
        const candidate = sha256(
          tokens.slice(index, index + tokenCount).join(" "),
        );
        const key = expected.get(candidate);
        if (key) present.add(key);
      }
    }
  }
  return present;
}

function signaturesPresentInFiles(directory, pattern, baselineSignatures) {
  if (!fs.existsSync(directory)) return new Set();
  return signaturesPresentInPaths(
    directory,
    fs.globSync(pattern, { cwd: directory }),
    baselineSignatures,
  );
}

export function collectVisibleContentFingerprints(repositoryRoot) {
  return collectFixtureSignatures(
    path.join(repositoryRoot, "app", "src", "content"),
    "**/*.{ts,tsx,json}",
  );
}

export function remainingFixtureFingerprintCount(
  repositoryRoot,
  generationRecord,
) {
  const scanTargets = [
    {
      directory: path.join(repositoryRoot, "app", "src"),
      files: applicationSourcePaths(repositoryRoot),
    },
    {
      directory: path.join(repositoryRoot, "app", "public"),
      files: publicAssetPaths(repositoryRoot),
    },
  ];
  const signatures = new Set();
  for (const { directory, files } of scanTargets) {
    const textFiles = files.filter((file) =>
      fixtureSourceTextExtensions.has(
        path.extname(file).toLocaleLowerCase("en"),
      ),
    );
    for (const key of signaturesPresentInPaths(
      directory,
      textFiles,
      generationRecord.fixtureContentFingerprints,
    )) {
      signatures.add(key);
    }
  }
  return signatures.size;
}

export function artifactFileDigests(artifactRoot, receiptName) {
  if (!fs.existsSync(artifactRoot)) return [];
  return regularFilesUnder(artifactRoot, "Production artifact")
    .filter((relativePath) => relativePath !== receiptName)
    .sort()
    .map((relativePath) => ({
      path: relativePath,
      sha256: sha256(
        fs.readFileSync(path.join(artifactRoot, relativePath)),
      ),
    }));
}

export function productionArtifactFindings(
  repositoryRoot,
  runtime,
  generationRecord,
) {
  const findings = [];
  const isStatic =
    runtime.runtime.deploymentProfile === "static-pages-worker";
  const artifactRoot = path.join(
    repositoryRoot,
    "app",
    isStatic ? "out" : ".next",
  );
  const buildMarker = isStatic
    ? artifactRoot
    : path.join(artifactRoot, "BUILD_ID");
  if (!fs.existsSync(buildMarker)) {
    return ["production artifact is missing; run the production build"];
  }

  const receiptName = ".foundation-build-receipt.json";
  const receiptPath = path.join(artifactRoot, receiptName);
  if (!fs.existsSync(receiptPath)) {
    return ["production build receipt is missing; run pnpm build:release"];
  }
  let receipt;
  try {
    receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  } catch {
    return ["production build receipt is not valid JSON"];
  }

  const gitHead = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).stdout.trim();
  const rootPackage = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
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
  const expectedBuildInputs = {
    basePath: runtime.runtime.basePath,
    defaultLocale: runtime.runtime.defaultLocale,
    deploymentProfile: runtime.runtime.deploymentProfile,
    enabledModules: runtime.runtime.enabledModules,
    siteUrl: runtime.runtime.siteUrl,
  };
  const comparisons = [
    ["source commit", receipt.source?.commit, gitHead],
    ["source state", receipt.source?.sourceState, "clean"],
    ["version", receipt.version, rootPackage.version],
    [
      "runtime contract digest",
      receipt.runtimeContractSha256,
      sha256(fs.readFileSync(runtimePath)),
    ],
    [
      "content manifest digest",
      receipt.contentManifestSha256,
      sha256(fs.readFileSync(contentManifestPath)),
    ],
    [
      "build inputs",
      JSON.stringify(receipt.buildInputs),
      JSON.stringify(expectedBuildInputs),
    ],
  ];
  for (const [label, actual, expected] of comparisons) {
    if (actual !== expected) {
      findings.push(`production build receipt ${label} does not match`);
    }
  }

  let fileDigests;
  try {
    fileDigests = artifactFileDigests(artifactRoot, receiptName);
  } catch (error) {
    findings.push(error.message);
    return findings;
  }
  if (JSON.stringify(receipt.artifact?.files) !== JSON.stringify(fileDigests)) {
    findings.push("production build receipt file digests do not match the artifact");
  }
  if (receipt.artifact?.sha256 !== sha256Json(fileDigests)) {
    findings.push("production build receipt artifact digest does not match");
  }

  const scanRoots = isStatic
    ? [artifactRoot]
    : [
        path.join(artifactRoot, "server"),
        path.join(artifactRoot, "static"),
      ];
  const remaining = new Set();
  for (const scanRoot of scanRoots) {
    for (const key of signaturesPresentInFiles(
      scanRoot,
      productionFixtureTextFilePattern,
      generationRecord.fixtureContentFingerprints,
    )) {
      remaining.add(key);
    }
  }
  if (remaining.size > 0) {
    findings.push(
      `production artifact contains ${remaining.size} original fixture fingerprints`,
    );
  }
  return findings;
}

export function generationRecordHistoryFindings(repositoryRoot) {
  const findings = [];
  const relativePath = "foundation/generation-record.json";
  const currentPath = path.join(repositoryRoot, relativePath);
  const gitRootResult = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (gitRootResult.status !== 0) {
    return ["generated repository has no Git history for provenance"];
  }
  const gitRoot = gitRootResult.stdout.trim();
  if (path.resolve(gitRoot) !== path.resolve(repositoryRoot)) {
    return ["generated repository is not the root of its Git history"];
  }
  const tracked = spawnSync(
    "git",
    ["ls-files", "--error-unmatch", relativePath],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  if (tracked.status !== 0) {
    findings.push("generation record is not tracked in Git");
    return findings;
  }
  const history = spawnSync(
    "git",
    ["log", "--follow", "--diff-filter=A", "--format=%H", "--", relativePath],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  const commits = history.stdout.trim().split(/\s+/).filter(Boolean);
  const creationCommit = commits.at(-1);
  if (history.status !== 0 || !creationCommit) {
    findings.push("generation record has no verifiable creation commit");
    return findings;
  }
  const original = spawnSync(
    "git",
    ["show", `${creationCommit}:${relativePath}`],
    { cwd: repositoryRoot, encoding: null },
  );
  if (
    original.status !== 0 ||
    !fs.existsSync(currentPath) ||
    !original.stdout.equals(fs.readFileSync(currentPath))
  ) {
    findings.push("generation record changed after its creation commit");
  }
  const status = spawnSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=normal"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  if (status.status !== 0 || status.stdout.trim()) {
    findings.push("release candidate repository is not clean");
  }
  return findings;
}
