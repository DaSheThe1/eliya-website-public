import { spawnSync } from "node:child_process";
import path from "node:path";

const semanticVersionPattern =
  /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/;
const fullCommitPattern = /^[0-9a-f]{40}$/;

function runGit(repositoryPath, arguments_) {
  return spawnSync("git", ["-C", repositoryPath, ...arguments_], {
    encoding: "utf8",
  });
}

function resolveIntegrationRefs(repositoryPath, integrationBranch) {
  const matches = [];
  for (const reference of [
    `refs/heads/${integrationBranch}`,
    `refs/remotes/origin/${integrationBranch}`,
  ]) {
    const resolved = runGit(repositoryPath, [
      "rev-parse",
      "--verify",
      `${reference}^{commit}`,
    ]);
    if (resolved.status === 0) {
      matches.push({ commit: resolved.stdout.trim(), reference });
    }
  }
  return matches;
}

export function readTargetFoundationIdentity(repositoryPath, baseCommit) {
  const root = path.resolve(repositoryPath);
  const contractPath = "foundation/runtime-contract.json";
  const runtimeAtBase = runGit(root, [
    "show",
    `${baseCommit}:${contractPath}`,
  ]);
  if (runtimeAtBase.status !== 0) {
    const trackedInTarget = runGit(root, [
      "ls-files",
      "--error-unmatch",
      contractPath,
    ]);
    if (trackedInTarget.status === 0) {
      throw new Error(
        `Target foundation identity is missing from ${baseCommit}:${contractPath}`,
      );
    }
    return null;
  }

  let runtime;
  try {
    runtime = JSON.parse(runtimeAtBase.stdout);
  } catch (error) {
    throw new Error(
      `Unable to read target foundation identity from ${baseCommit}:${contractPath}: ${error.message}`,
    );
  }

  const version = runtime?.foundation?.version;
  const commit = runtime?.foundation?.commit;
  if (
    typeof version !== "string" ||
    !semanticVersionPattern.test(version) ||
    typeof commit !== "string" ||
    !fullCommitPattern.test(commit)
  ) {
    throw new Error(
      `Target runtime contract has an invalid foundation identity: ${baseCommit}:${contractPath}`,
    );
  }

  return {
    version,
    commit,
    contractPath: `${baseCommit}:${contractPath}`,
  };
}

export function taskFoundationIdentityFindings(task) {
  const targetIdentity = readTargetFoundationIdentity(
    task.repositoryPath,
    task.baseCommit,
  );
  if (!targetIdentity) {
    return [];
  }

  const findings = [];
  for (const [label, packetValue, targetValue] of [
    ["version", task.foundation.version, targetIdentity.version],
    ["commit", task.foundation.commit, targetIdentity.commit],
  ]) {
    if (packetValue !== targetValue) {
      findings.push(
        `${task.taskId} foundation ${label} ${packetValue} does not match ${targetIdentity.contractPath}: ${targetValue}`,
      );
    }
  }
  return findings;
}

export function taskRepositoryBindingFindings(task) {
  const findings = [...taskFoundationIdentityFindings(task)];
  const integrations = resolveIntegrationRefs(
    task.repositoryPath,
    task.integrationBranch,
  );
  if (integrations.length === 0) {
    findings.push(
      `${task.taskId} integration branch is unavailable: ${task.integrationBranch}`,
    );
    return findings;
  }

  const baseIntegration = integrations.find(
    (integration) =>
      runGit(task.repositoryPath, [
        "merge-base",
        "--is-ancestor",
        task.baseCommit,
        integration.commit,
      ]).status === 0,
  );
  if (!baseIntegration) {
    findings.push(
      `${task.taskId} base commit is not an ancestor of any ${task.integrationBranch} ref`,
    );
  }
  if (task.reviewedCommit) {
    const reviewedIntegration = integrations.find(
      (integration) =>
        runGit(task.repositoryPath, [
          "merge-base",
          "--is-ancestor",
          task.reviewedCommit,
          integration.commit,
        ]).status === 0,
    );
    if (!reviewedIntegration) {
      findings.push(
        `${task.taskId} reviewed commit is not contained in any ${task.integrationBranch} ref`,
      );
    }
  }
  return findings;
}
