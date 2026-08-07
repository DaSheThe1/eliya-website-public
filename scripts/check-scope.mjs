import process from "node:process";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { validateJson } from "./lib/schema.mjs";
import { matchesPattern } from "./lib/path-pattern.mjs";

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const taskFile = valueAfter("--task");

if (!taskFile) {
  console.error("Usage: node scripts/check-scope.mjs --task <task.json>");
  process.exit(2);
}

const task = validateJson(path.resolve(taskFile), "task-packet.schema.json");
function gitNames(arguments_) {
  const result = spawnSync(
    "git",
    ["-C", process.cwd(), ...arguments_],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    console.error(result.stderr || "Unable to inspect task changes.");
    process.exit(1);
  }

  return result.stdout.split("\n");
}

const untracked = spawnSync(
  "git",
  ["-C", process.cwd(), "ls-files", "--others", "--exclude-standard"],
  { encoding: "utf8" },
);

if (untracked.status !== 0) {
  console.error(untracked.stderr || "Unable to inspect untracked files.");
  process.exit(1);
}

const files = [
  ...gitNames([
    "diff",
    "--name-only",
    "--diff-filter=ACMRTUXBD",
    `${task.baseCommit}...HEAD`,
  ]),
  ...gitNames(["diff", "--name-only", "--diff-filter=ACMRTUXBD"]),
  ...gitNames(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXBD"]),
  ...untracked.stdout.split("\n"),
]
  .map((entry) => entry.trim())
  .filter(Boolean)
  .filter((entry, index, entries) => entries.indexOf(entry) === index);
const violations = files.filter(
  (file) =>
    !task.writeAllowlist.some((pattern) => matchesPattern(file, pattern)),
);

if (violations.length > 0) {
  console.error("Task scope violation:");
  for (const file of violations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(`Scope check passed for ${files.length} changed file(s).`);
