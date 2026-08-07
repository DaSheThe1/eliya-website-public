import { spawnSync } from "node:child_process";

function currentCommit(repositoryRoot) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function validGitWorkflowRef(reference, repositoryRoot) {
  if (/^[0-9a-f]{40}$/i.test(reference)) {
    return false;
  }
  return (
    spawnSync("git", ["check-ref-format", `refs/heads/${reference}`], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).status === 0
  );
}

export function collectPairedReleaseFindings({
  brief,
  manifest,
  workerConfig,
  repositoryRoot,
}) {
  const findings = [];
  const expectedScriptName = `${brief.project.slug}-intake`;
  const expectedRoute = brief.deployment.domain
    ? `https://${brief.deployment.domain}${brief.deployment.basePath}/api/contact`
    : `https://REQUIRED_PUBLIC_HOST${brief.deployment.basePath}/api/contact`;
  const configuredRoute = workerConfig.routes?.[0]?.pattern;

  if (workerConfig.name !== expectedScriptName) {
    findings.push("Worker config name does not match the approved project slug");
  }
  if (configuredRoute !== expectedRoute) {
    findings.push("Worker config route does not match the approved domain and base path");
  }

  for (const [label, release] of [
    ["candidate", manifest.candidate],
    ["previous release", manifest.previousRelease],
  ]) {
    if ("workerScriptName" in release) {
      if (release.workerScriptName !== workerConfig.name) {
        findings.push(`${label} Worker name does not match worker/wrangler.jsonc`);
      }
      if (release.workerRoute !== configuredRoute) {
        findings.push(`${label} Worker route does not match worker/wrangler.jsonc`);
      }
      if (
        release.state === "exact" &&
        !validGitWorkflowRef(release.publicWorkflowRef, repositoryRoot)
      ) {
        findings.push(
          `${label} public workflow ref is not a valid Git branch or tag name`,
        );
      }
    }
  }

  if (manifest.candidate.state === "exact") {
    const head = currentCommit(repositoryRoot);
    if (!head) {
      findings.push("current private source commit could not be resolved");
    } else if (manifest.candidate.privateSourceCommit !== head) {
      findings.push("candidate private source commit does not equal repository HEAD");
    }
  }

  return [...new Set(findings)];
}
