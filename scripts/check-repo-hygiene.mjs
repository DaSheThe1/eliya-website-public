import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const listed = spawnSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
);

function walk(directory, root = directory) {
  const ignoredDirectories = new Set([
    ".git",
    ".next",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "playwright-report",
    "test-results",
  ]);
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute, root));
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolute));
    }
  }

  return files;
}

const repositoryFiles =
  listed.status === 0
    ? listed.stdout.split("\n").filter(Boolean)
    : walk(process.cwd());

const forbiddenPaths = [
  /(^|\/)\.wrangler(\/|$)/,
  /(^|\/)\.dev\.vars(?:\..+)?$/,
  /(^|\/)\.env$/,
  /(^|\/)\.env\.(?!example$).+/,
  /(^|\/)id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?$/,
  /(^|\/).*deploy.*(?:key|pem)$/i,
];
const textPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[opurs]_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:CONTACT_WEBHOOK_SECRET|N8N_WEBHOOK_(?:URL|SECRET|SIGNING_SECRET)|INTAKE_DUPLICATE_SECRET)\s*=\s*[^\s#][^\n]*/i,
];
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".env",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sh",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const findings = [];

for (const file of repositoryFiles) {
  if (!fs.existsSync(file)) {
    continue;
  }

  if (forbiddenPaths.some((pattern) => pattern.test(file))) {
    findings.push(`${file}: forbidden path`);
    continue;
  }

  if (!textExtensions.has(path.extname(file).toLowerCase())) {
    continue;
  }

  const content = fs.readFileSync(file, "utf8");
  for (const pattern of textPatterns) {
    if (pattern.test(content)) {
      findings.push(`${file}: matched ${pattern}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Repository hygiene check failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("Repository hygiene check passed.");
