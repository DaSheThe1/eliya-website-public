import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function generatedModuleValidationCommand(command) {
  const generatedCommand = command.replace(
    /^pnpm --filter @foundation\/next-landing(?:\s|$)/,
    (prefix) =>
      prefix.endsWith(" ") ? "pnpm --dir app " : "pnpm --dir app",
  );
  return generatedCommand.replace(
    /^pnpm --dir app test:e2e(?: --)?(?=\s|$)/,
    "pnpm --dir app test:e2e:module",
  );
}

export function moduleContractSnapshot(manifest) {
  return {
    id: manifest.id,
    version: manifest.version,
    readiness: clone(manifest.readiness),
    validation: [...manifest.validation],
  };
}

export function supportedClientValidationCommand(command) {
  return /^(?:node --test [A-Za-z0-9._/-]+|pnpm --dir (?:app|worker) [A-Za-z0-9:_-]+(?: (?:-- )?[A-Za-z0-9._/-]+)?)$/.test(
    command,
  );
}

export function validationCommandReferencesBrowserTest(
  command,
  browserTestPath,
) {
  const generatedPath = browserTestPath.replace(/^app\//, "");
  return command.split(" ").includes(generatedPath);
}

function runCommand(command, repositoryRoot) {
  const [executable, ...arguments_] = command.split(" ");
  return spawnSync(executable, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
  });
}

function exactRegularFileFinding(repositoryRoot, relativePath, label) {
  const repositoryPrefix = `${path.resolve(repositoryRoot)}${path.sep}`;
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  if (!absolutePath.startsWith(repositoryPrefix)) {
    return `${label} escapes the client repository: ${relativePath}`;
  }
  if (!fs.existsSync(absolutePath)) {
    return `${label} is missing: ${relativePath}`;
  }
  const stat = fs.lstatSync(absolutePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    return `${label} must be an exact regular non-symlink file: ${relativePath}`;
  }
  if (stat.size === 0) {
    return `${label} is empty: ${relativePath}`;
  }
  return null;
}

function currentModuleContract(repositoryRoot, moduleId) {
  const manifestPath = path.join(
    repositoryRoot,
    "modules",
    moduleId,
    "module.json",
  );
  if (!fs.existsSync(manifestPath)) {
    return { finding: `selected module manifest is missing: ${moduleId}` };
  }
  try {
    return {
      contract: moduleContractSnapshot(
        JSON.parse(fs.readFileSync(manifestPath, "utf8")),
      ),
    };
  } catch {
    return { finding: `selected module manifest is invalid JSON: ${moduleId}` };
  }
}

export function collectModuleReadinessFindings({
  repositoryRoot,
  generationRecord,
  enabledModules,
  executeValidation = true,
  commandRunner = runCommand,
}) {
  const findings = [];
  const immutableContracts = generationRecord.moduleContracts ?? [];
  const expectedIds = [...enabledModules].sort();
  const immutableIds = immutableContracts.map(({ id }) => id).sort();
  if (!same(expectedIds, immutableIds)) {
    findings.push(
      "immutable module contract set does not match the enabled runtime modules",
    );
  }

  const commandResults = new Map();
  for (const contract of immutableContracts) {
    const moduleFindings = [];
    const current = currentModuleContract(repositoryRoot, contract.id);
    if (current.finding) {
      moduleFindings.push(current.finding);
    } else if (!same(current.contract, contract)) {
      moduleFindings.push(
        `selected module contract drifted from immutable generation record: ${contract.id}`,
      );
    }

    if (contract.readiness.status !== "client-implementation-required") {
      findings.push(...moduleFindings);
      continue;
    }

    for (const implementationPath of contract.readiness.implementationPaths) {
      const finding = exactRegularFileFinding(
        repositoryRoot,
        implementationPath,
        `module ${contract.id} implementation`,
      );
      if (finding) moduleFindings.push(finding);
    }
    for (const browserTestPath of contract.readiness.browserTestPaths) {
      const finding = exactRegularFileFinding(
        repositoryRoot,
        browserTestPath,
        `module ${contract.id} browser test`,
      );
      if (finding) moduleFindings.push(finding);
      if (
        !contract.validation.some((command) =>
          validationCommandReferencesBrowserTest(command, browserTestPath),
        )
      ) {
        moduleFindings.push(
          `module ${contract.id} has no validation command for browser test ${browserTestPath}`,
        );
      }
    }
    for (const command of contract.validation) {
      if (!supportedClientValidationCommand(command)) {
        moduleFindings.push(
          `module ${contract.id} has unsupported validation command: ${command}`,
        );
      }
    }

    findings.push(...moduleFindings);
    if (!executeValidation || moduleFindings.length > 0) {
      continue;
    }

    for (const command of contract.validation) {
      let result = commandResults.get(command);
      if (!result) {
        result = commandRunner(command, repositoryRoot);
        commandResults.set(command, result);
      }
      if (result.status !== 0) {
        findings.push(
          `module ${contract.id} validation failed: ${command}`,
        );
      }
    }
  }

  return [...new Set(findings)];
}
