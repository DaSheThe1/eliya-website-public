import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { matchesPattern } from "./lib/path-pattern.mjs";
import { validateJson } from "./lib/schema.mjs";
import { taskRepositoryBindingFindings } from "./lib/task-foundation.mjs";

function argument(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function runGit(repositoryPath, arguments_) {
  return spawnSync("git", ["-C", repositoryPath, ...arguments_], {
    encoding: "utf8",
  });
}

function requiredCheckFindings(task, handoff, ready) {
  const findings = [];
  for (const command of task.validationCommands) {
    const result = handoff.checks.find((check) => check.command === command);
    if (!result) {
      findings.push(`required check is missing from handoff: ${command}`);
    } else if (ready && result.status !== "passed") {
      findings.push(
        `required check did not pass: ${command} (${result.status})`,
      );
    }
  }
  return findings;
}

function resolveTaskBranches(repositoryPath, branch) {
  const matches = [];
  for (const reference of [
    `refs/heads/${branch}`,
    `refs/remotes/origin/${branch}`,
  ]) {
    const result = runGit(repositoryPath, [
      "rev-parse",
      "--verify",
      `${reference}^{commit}`,
    ]);
    if (result.status === 0) {
      matches.push({ reference, commit: result.stdout.trim() });
    }
  }
  return matches;
}

function implementationFindings(task, handoff) {
  const findings = [];
  for (const [label, actual, expected] of [
    ["task ID", handoff.taskId, task.taskId],
    ["branch", handoff.branch, task.branch],
    ["base commit", handoff.baseCommit, task.baseCommit],
  ]) {
    if (actual !== expected) {
      findings.push(`${label} does not match the task packet`);
    }
  }
  findings.push(
    ...requiredCheckFindings(task, handoff, handoff.status === "complete"),
  );
  if (handoff.status !== "complete" || !handoff.commit) return findings;

  const commitCheck = runGit(task.repositoryPath, [
    "cat-file",
    "-e",
    `${handoff.commit}^{commit}`,
  ]);
  if (commitCheck.status !== 0) {
    findings.push(`handoff commit is unavailable: ${handoff.commit}`);
    return findings;
  }
  if (
    runGit(task.repositoryPath, [
      "merge-base",
      "--is-ancestor",
      task.baseCommit,
      handoff.commit,
    ]).status !== 0
  ) {
    findings.push("handoff commit is not descended from the task base");
  }
  const branches = resolveTaskBranches(task.repositoryPath, task.branch);
  if (branches.length === 0) {
    findings.push(`task branch is unavailable: ${task.branch}`);
  } else if (
    !branches.some(
      (branch) =>
        runGit(task.repositoryPath, [
          "merge-base",
          "--is-ancestor",
          handoff.commit,
          branch.commit,
        ]).status === 0,
    )
  ) {
    findings.push("handoff commit is not contained in any task branch ref");
  }

  const diff = runGit(task.repositoryPath, [
    "diff",
    "--name-only",
    "--diff-filter=ACMRTUXBD",
    `${task.baseCommit}...${handoff.commit}`,
  ]);
  if (diff.status !== 0) {
    findings.push("unable to inspect the exact task diff");
    return findings;
  }
  const actualFiles = diff.stdout.split("\n").filter(Boolean).sort();
  const reportedFiles = [...handoff.changedFiles].sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(reportedFiles)) {
    findings.push("handoff changedFiles do not match the exact task diff");
  }
  const scopeViolations = actualFiles.filter(
    (file) =>
      !task.writeAllowlist.some((pattern) => matchesPattern(file, pattern)),
  );
  for (const file of scopeViolations) {
    findings.push(`task diff is outside the write allowlist: ${file}`);
  }
  return findings;
}

function reviewFindings(task, handoff) {
  const findings = [];
  if (handoff.taskId !== task.taskId) {
    findings.push("task ID does not match the reviewer packet");
  }
  if (handoff.reviewedCommit !== task.reviewedCommit) {
    findings.push("reviewed commit does not match the reviewer packet");
  }
  findings.push(
    ...requiredCheckFindings(task, handoff, handoff.status === "pass"),
  );
  const commitCheck = runGit(task.repositoryPath, [
    "cat-file",
    "-e",
    `${handoff.reviewedCommit}^{commit}`,
  ]);
  if (commitCheck.status !== 0) {
    findings.push(`reviewed commit is unavailable: ${handoff.reviewedCommit}`);
  }
  return findings;
}

const taskPath = argument("--task");
const handoffPath = argument("--handoff");
const requireReady = process.argv.includes("--require-ready");
if (!taskPath || !handoffPath) {
  console.error(
    "Usage: node scripts/validate-handoff.mjs --task <task.json> --handoff <handoff.json> [--require-ready]",
  );
  process.exit(2);
}

const task = validateJson(
  path.resolve(taskPath),
  "task-packet.schema.json",
);
const schemaName = path.basename(task.handoff.schema);
const handoff = validateJson(path.resolve(handoffPath), schemaName);
let findings;
try {
  findings = taskRepositoryBindingFindings(task);
} catch (error) {
  findings = [error.message];
}
findings.push(
  ...(task.role === "reviewer"
    ? reviewFindings(task, handoff)
    : implementationFindings(task, handoff)),
);
if (requireReady) {
  const readyStatus = task.role === "reviewer" ? "pass" : "complete";
  if (handoff.status !== readyStatus) {
    findings.push(
      `handoff status ${handoff.status} is not integration-ready (${readyStatus})`,
    );
  }
}

if (findings.length > 0) {
  console.error("Task/handoff validation failed:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}
console.log(
  `Task/handoff binding is valid for ${task.taskId} at status ${handoff.status}.`,
);
