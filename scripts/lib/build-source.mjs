import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function git(repositoryRoot, arguments_) {
  return spawnSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

export function resolveBuildSourceIdentity(
  repositoryRoot,
  environment = process.env,
) {
  const expectedRoot = path.resolve(repositoryRoot);
  const gitRoot = git(expectedRoot, ["rev-parse", "--show-toplevel"]);

  if (gitRoot.status === 0) {
    if (path.resolve(gitRoot.stdout.trim()) !== expectedRoot) {
      throw new Error(
        "Production builds require the generated repository Git root.",
      );
    }
    const gitStatus = git(expectedRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=normal",
    ]);
    if (gitStatus.status !== 0 || gitStatus.stdout.trim()) {
      throw new Error(
        "Production build receipt requires an exact clean source commit.",
      );
    }
    const sourceCommit = git(expectedRoot, ["rev-parse", "HEAD"]).stdout.trim();
    if (!/^[0-9a-f]{40}$/.test(sourceCommit)) {
      throw new Error("Unable to resolve the production build source commit.");
    }
    return { commit: sourceCommit, sourceState: "clean" };
  }

  if (environment.FOUNDATION_BUILD_CONTEXT !== "container") {
    throw new Error(
      "Production builds require the generated repository Git root.",
    );
  }
  const sourceCommit = environment.FOUNDATION_BUILD_SOURCE_COMMIT ?? "";
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) {
    throw new Error(
      "Container production builds require an exact full source commit.",
    );
  }
  const contextMarkerPath = path.join(
    expectedRoot,
    ".foundation-build-source-commit",
  );
  if (
    !fs.existsSync(contextMarkerPath) ||
    fs.readFileSync(contextMarkerPath, "utf8").trim() !== sourceCommit
  ) {
    throw new Error(
      "Container build context marker does not match the reviewed source commit.",
    );
  }
  return { commit: sourceCommit, sourceState: "clean" };
}
