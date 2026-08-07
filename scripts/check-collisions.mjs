import path from "node:path";
import process from "node:process";

import { validateJson } from "./lib/schema.mjs";
import { patternsMayOverlap } from "./lib/path-pattern.mjs";
import { taskFoundationIdentityFindings } from "./lib/task-foundation.mjs";

const taskFiles = process.argv
  .slice(2)
  .filter((argument) => !argument.startsWith("-"));

if (taskFiles.length < 2) {
  console.error(
    "Usage: node scripts/check-collisions.mjs <concurrent-task-a.json> <concurrent-task-b.json> [...]",
  );
  process.exit(2);
}

const protectedPatterns = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  "schemas/**",
  "modules/**/module.json",
  ".coordination/contracts/**",
];

const tasks = taskFiles.map((file) =>
  validateJson(path.resolve(file), "task-packet.schema.json"),
);
const findings = [];

for (const task of tasks) {
  try {
    findings.push(...taskFoundationIdentityFindings(task));
  } catch (error) {
    findings.push(`${task.taskId}: ${error.message}`);
  }
}

function duplicateValues(label, values) {
  const seen = new Map();

  for (const [taskId, value] of values) {
    if (value === undefined) {
      continue;
    }

    const previous = seen.get(value);
    if (previous) {
      findings.push(`${label} ${value} is shared by ${previous} and ${taskId}`);
    } else {
      seen.set(value, taskId);
    }
  }
}

duplicateValues(
  "Task ID",
  tasks.map((task) => [task.taskId, task.taskId]),
);
duplicateValues(
  "Branch",
  tasks.map((task) => [task.taskId, task.branch]),
);
duplicateValues(
  "Worktree",
  tasks.map((task) => [
    task.taskId,
    task.worktreePath ? path.resolve(task.worktreePath) : undefined,
  ]),
);
duplicateValues(
  "Handoff destination",
  tasks.map((task) => [
    task.taskId,
    path.posix.normalize(task.handoff.coordinatorDestination),
  ]),
);

const reference = tasks[0];
for (const task of tasks.slice(1)) {
  for (const [label, left, right] of [
    [
      "repository path",
      path.resolve(reference.repositoryPath),
      path.resolve(task.repositoryPath),
    ],
    ["full base commit", reference.baseCommit, task.baseCommit],
    ["integration branch", reference.integrationBranch, task.integrationBranch],
    ["foundation version", reference.foundation.version, task.foundation.version],
    ["foundation commit", reference.foundation.commit, task.foundation.commit],
  ]) {
    if (left !== right) {
      findings.push(
        `${task.taskId} has inconsistent ${label}: ${right}; expected ${left} from ${reference.taskId}`,
      );
    }
  }
}

const taskIds = new Set(tasks.map((task) => task.taskId));
for (const task of tasks) {
  for (const dependency of task.dependencies) {
    if (taskIds.has(dependency)) {
      findings.push(
        `${task.taskId} depends on ${dependency}; dependent tasks are sequential and must not be dispatched as one concurrent set`,
      );
    }
  }

  if (task.role === "coordinator" || task.role === "reviewer") {
    continue;
  }

  for (const allowed of task.writeAllowlist) {
    for (const protectedPattern of protectedPatterns) {
      if (patternsMayOverlap(allowed, protectedPattern)) {
        findings.push(
          `${task.taskId} grants non-coordinator access to ${allowed}, overlapping ${protectedPattern}`,
        );
      }
    }
  }
}

for (let leftIndex = 0; leftIndex < tasks.length; leftIndex += 1) {
  for (
    let rightIndex = leftIndex + 1;
    rightIndex < tasks.length;
    rightIndex += 1
  ) {
    const left = tasks[leftIndex];
    const right = tasks[rightIndex];

    for (const leftPattern of left.writeAllowlist) {
      for (const rightPattern of right.writeAllowlist) {
        if (patternsMayOverlap(leftPattern, rightPattern)) {
          findings.push(
            `${left.taskId} (${leftPattern}) overlaps ${right.taskId} (${rightPattern})`,
          );
        }
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Concurrent task collisions:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(
  `No ownership or identity collisions across ${tasks.length} concurrently dispatched task packets.`,
);
