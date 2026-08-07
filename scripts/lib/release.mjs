import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  generationRecordHistoryFindings,
  productionArtifactFindings,
  remainingFixtureFingerprintCount,
} from "./artifact-binding.mjs";
import { collectModuleReadinessFindings } from "./module-readiness.mjs";
import { collectRuntimeBindingFindings } from "./runtime-binding.mjs";

function unresolvedStatus(status) {
  return ["derived", "placeholder", "deferred"].includes(status);
}

function inspectDecisionText(findings, label, decision) {
  if (unresolvedStatus(decision.status)) {
    findings.push(`${label} remains ${decision.status}`);
  }
  if (decision.source.kind === "placeholder") {
    findings.push(`${label} still uses a placeholder source`);
  }
  if (
    decision.blockingLevel !== "optional" &&
    !["confirmed", "client-supplied"].includes(decision.status)
  ) {
    findings.push(`${label} remains a ${decision.blockingLevel} decision`);
  }
}

export function collectBriefReleaseFindings(brief) {
  const findings = [];

  inspectDecisionText(findings, "business.identity", brief.business.identity);
  inspectDecisionText(findings, "business.offer", brief.business.offer);
  inspectDecisionText(findings, "design.direction", brief.design.direction);
  for (const source of brief.business.source) {
    if (source.kind === "placeholder") {
      findings.push("business authority contains a placeholder source");
    }
  }
  brief.business.differentiators.forEach((decision, index) =>
    inspectDecisionText(
      findings,
      `business.differentiators[${index}]`,
      decision,
    ),
  );
  brief.audiences.forEach((audience) => {
    inspectDecisionText(findings, `audiences.${audience.id}`, audience.description);
    if (audience.source.kind === "placeholder") {
      findings.push(`audience ${audience.id} uses a placeholder source`);
    }
  });

  for (const conversion of [
    brief.conversion.primary,
    ...brief.conversion.secondary,
  ]) {
    if (conversion.status !== "confirmed") {
      findings.push(`conversion ${conversion.id} remains ${conversion.status}`);
    }
    if (conversion.source.kind === "placeholder") {
      findings.push(`conversion ${conversion.id} uses a placeholder source`);
    }
  }
  for (const locale of brief.localization.locales) {
    if (locale.status !== "confirmed") {
      findings.push(`locale ${locale.locale} remains ${locale.status}`);
    }
  }
  for (const route of brief.routes) {
    if (route.status !== "confirmed") {
      findings.push(`route ${route.id} remains ${route.status}`);
    }
  }
  for (const module of brief.modules) {
    if (module.status !== "confirmed") {
      findings.push(`module ${module.id} remains ${module.status}`);
    }
  }

  for (const source of brief.content.authority) {
    if (source.kind === "placeholder") {
      findings.push("content authority contains a placeholder source");
    }
  }
  if (brief.content.copyStatus !== "confirmed") {
    findings.push(`copyStatus is ${brief.content.copyStatus}`);
  }
  if (!["confirmed", "not-required"].includes(brief.content.mediaStatus)) {
    findings.push(`mediaStatus is ${brief.content.mediaStatus}`);
  }
  if (brief.content.testimonials === "samples") {
    findings.push("sample testimonials cannot ship");
  }
  for (const claim of brief.content.claims) {
    if (!["confirmed", "client-supplied"].includes(claim.status)) {
      findings.push(`claim ${claim.id} is ${claim.status}`);
    }
    if (claim.source.kind === "placeholder") {
      findings.push(`claim ${claim.id} uses a placeholder source`);
    }
    if (claim.approval.status !== "approved" || !claim.approval.approvedAt) {
      findings.push(`claim ${claim.id} lacks recorded approval`);
    }
  }

  for (const decision of brief.decisions) {
    if (["placeholder", "deferred"].includes(decision.status)) {
      findings.push(`decision ${decision.id} remains ${decision.status}`);
    }
    if (
      decision.blockingLevel !== "optional" &&
      !["confirmed", "client-supplied"].includes(decision.status)
    ) {
      findings.push(
        `decision ${decision.id} remains ${decision.blockingLevel}`,
      );
    }
    const approvalIsOptionalDerived =
      decision.status === "derived" &&
      decision.blockingLevel === "optional" &&
      decision.approval.status === "not-required";
    if (
      !approvalIsOptionalDerived &&
      (decision.approval.status !== "approved" ||
        !decision.approval.approvedAt)
    ) {
      findings.push(`decision ${decision.id} lacks recorded approval`);
    }
    if (decision.source.kind === "placeholder") {
      findings.push(`decision ${decision.id} uses a placeholder source`);
    }
  }

  if (
    brief.integrations.intake.mode !== "none" &&
    !brief.integrations.privacy.retentionConfirmed
  ) {
    findings.push("intake retention is not confirmed");
  }
  if (
    brief.integrations.intake.mode !== "none" &&
    !["confirmed", "not-required"].includes(
      brief.integrations.privacy.noticeStatus,
    )
  ) {
    findings.push(`privacy notice is ${brief.integrations.privacy.noticeStatus}`);
  }
  if (!brief.deployment.domain) {
    findings.push("deployment domain is unresolved");
  }
  for (const item of brief.openItems) {
    if (item.blockingLevel !== "optional") {
      findings.push(
        `open ${item.blockingLevel} item ${item.id}: ${item.question}`,
      );
    }
  }

  return [...new Set(findings)];
}

function readRequiredJson(repositoryRoot, relativePath, findings) {
  const absolutePath = path.join(repositoryRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    findings.push(`${relativePath} is required for release`);
    return null;
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function gitCheck(repositoryRoot, arguments_) {
  return spawnSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

export function collectStaticWorkerReceiptFindings(
  brief,
  repositoryRoot,
) {
  if (
    brief.deployment.profile !== "static-pages-worker" ||
    brief.integrations.intake.mode === "none"
  ) {
    return [];
  }

  const providerVerifierBlocker =
    "static lead/booking release is blocked until a provider-specific attestation verifier authenticates the GitHub Pages deployment and exact static artifact plus the Cloudflare Worker identity, route ownership, and exact packaged provenance";
  const findings = [];
  const receiptRelative = "foundation/static-worker-receipt.json";
  const receiptPath = path.join(repositoryRoot, receiptRelative);
  if (!fs.existsSync(receiptPath)) {
    return [
      "static lead/booking release is missing its provider evidence record",
      providerVerifierBlocker,
    ];
  }

  let receipt;
  try {
    receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  } catch {
    return ["static Worker release receipt is not valid JSON"];
  }
  const expectedOrigin = `https://${brief.deployment.domain}`;
  const expectedPath = `${brief.deployment.basePath}/api/contact`;
  if (receipt.route?.origin !== expectedOrigin) {
    findings.push("static Worker route origin does not match the approved domain");
  }
  if (receipt.route?.path !== expectedPath) {
    findings.push("static Worker route path does not match the approved base path");
  }
  if (receipt.contract?.version !== "1.0") {
    findings.push("static Worker intake contract version does not match the site");
  }
  if (
    receipt.contract?.submissionType !== brief.integrations.intake.mode
  ) {
    findings.push(
      "static Worker submission type does not match the reviewed intake mode",
    );
  }
  if (!brief.project.owners.includes(receipt.approval?.owner)) {
    findings.push("static Worker receipt approval owner is not a site owner");
  }
  if (
    /required|placeholder/i.test(receipt.route?.providerReceipt ?? "") ||
    /required|placeholder/i.test(
      receipt.workerArtifact?.sourceRepository ?? "",
    )
  ) {
    findings.push("static Worker receipt still contains a placeholder reference");
  }

  const trackedReceipt = gitCheck(repositoryRoot, [
    "ls-files",
    "--error-unmatch",
    receiptRelative,
  ]);
  const cleanReceipt = gitCheck(repositoryRoot, [
    "diff",
    "--quiet",
    "HEAD",
    "--",
    receiptRelative,
  ]);
  if (trackedReceipt.status !== 0 || cleanReceipt.status !== 0) {
    findings.push("static Worker receipt must be committed before release");
  }

  const staticCommit = receipt.staticArtifact?.sourceCommit ?? "";
  const commitExists = gitCheck(repositoryRoot, [
    "cat-file",
    "-e",
    `${staticCommit}^{commit}`,
  ]);
  const commitIsAncestor = gitCheck(repositoryRoot, [
    "merge-base",
    "--is-ancestor",
    staticCommit,
    "HEAD",
  ]);
  if (commitExists.status !== 0 || commitIsAncestor.status !== 0) {
    findings.push("static artifact source commit is not in the current release history");
  } else {
    const relevantDrift = gitCheck(repositoryRoot, [
      "diff",
      "--quiet",
      staticCommit,
      "HEAD",
      "--",
      "app",
      "packages",
      "modules",
      "worker",
      ".github/workflows",
      "deployment/static-pages-worker",
      "deployment/private-to-public-mirror",
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "foundation/content-manifest.json",
      "foundation/runtime-contract.json",
      "foundation/site-brief.json",
    ]);
    if (relevantDrift.status !== 0) {
      findings.push(
        "client runtime or content changed after the verified static artifact commit",
      );
    }
  }

  findings.push(providerVerifierBlocker);
  return [...new Set(findings)];
}

export function collectReleaseFindings(brief, repositoryRoot) {
  const findings = collectBriefReleaseFindings(brief);
  findings.push(
    ...collectStaticWorkerReceiptFindings(brief, repositoryRoot),
  );

  const rootPackagePath = path.join(repositoryRoot, "package.json");
  const appPackagePath = fs.existsSync(path.join(repositoryRoot, "app", "package.json"))
    ? path.join(repositoryRoot, "app", "package.json")
    : path.join(repositoryRoot, "templates", "next-landing", "package.json");
  if (fs.existsSync(rootPackagePath) && fs.existsSync(appPackagePath)) {
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
    const appPackage = JSON.parse(fs.readFileSync(appPackagePath, "utf8"));
    if (rootPackage.version !== appPackage.version) {
      findings.push(
        `root version ${rootPackage.version} does not match app version ${appPackage.version}`,
      );
    }
    const changelogPath = path.join(repositoryRoot, "CHANGELOG.md");
    const changelog = fs.existsSync(changelogPath)
      ? fs.readFileSync(changelogPath, "utf8")
      : "";
    const escapedVersion = rootPackage.version.replaceAll(".", "\\.");
    if (
      !new RegExp(
        `^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`,
        "m",
      ).test(changelog)
    ) {
      findings.push(
        `CHANGELOG.md lacks a dated ${rootPackage.version} release entry`,
      );
    }
  }

  const runtime = readRequiredJson(
    repositoryRoot,
    "foundation/runtime-contract.json",
    findings,
  );
  const generationRecord = readRequiredJson(
    repositoryRoot,
    "foundation/generation-record.json",
    findings,
  );
  const contentManifest = readRequiredJson(
    repositoryRoot,
    "foundation/content-manifest.json",
    findings,
  );
  if (runtime && generationRecord && contentManifest) {
    findings.push(
      ...collectRuntimeBindingFindings({
        brief,
        runtime,
        generationRecord,
        contentManifest,
        repositoryRoot,
      }),
    );
    findings.push(...generationRecordHistoryFindings(repositoryRoot));
    findings.push(
      ...collectModuleReadinessFindings({
        repositoryRoot,
        generationRecord,
        enabledModules: runtime.runtime.enabledModules,
      }),
    );
    if (runtime.foundation.sourceState !== "clean") {
      findings.push("site was generated from an uncommitted foundation state");
    }
    if (runtime.runtime.contentBinding !== "approved") {
      findings.push(`runtime content binding is ${runtime.runtime.contentBinding}`);
    }
    if (
      contentManifest.status !== "approved" ||
      contentManifest.approval.status !== "approved" ||
      !contentManifest.approval.approvedAt
    ) {
      findings.push("client-visible content lacks exact artifact approval");
    }
    const remaining = remainingFixtureFingerprintCount(
      repositoryRoot,
      generationRecord,
    );
    if (remaining > 0) {
      findings.push(
        `${remaining} original foundation fixture content fingerprints remain`,
      );
    }
    findings.push(
      ...productionArtifactFindings(
        repositoryRoot,
        runtime,
        generationRecord,
      ),
    );
  }

  return [...new Set(findings)];
}
