import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  canonicalJson,
  collectContentArtifacts,
  sha256Json,
} from "./artifact-binding.mjs";

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function expectedSiteUrl(brief) {
  return brief.deployment.domain
    ? `https://${brief.deployment.domain}`
    : "http://localhost:3000";
}

export function collectRuntimeBindingFindings({
  brief,
  runtime,
  generationRecord,
  contentManifest,
  repositoryRoot,
}) {
  const findings = [];
  const expectedBriefHash = createHash("sha256")
    .update(canonicalJson(brief))
    .digest("hex");

  if (runtime.brief.sha256 !== expectedBriefHash) {
    findings.push("runtime contract brief hash does not match the site brief");
  }
  if (!same(runtime.foundation, generationRecord.foundation)) {
    findings.push("runtime foundation identity does not match the generation record");
  }
  if (runtime.runtime.generationRecordSha256 !== sha256Json(generationRecord)) {
    findings.push("runtime generation record digest does not match");
  }
  if (runtime.runtime.defaultLocale !== brief.localization.defaultLocale) {
    findings.push("runtime default locale does not match the site brief");
  }
  if (!same(runtime.runtime.locales, brief.localization.locales)) {
    findings.push("runtime locales do not match the site brief");
  }
  if (runtime.runtime.motion !== brief.design.motion) {
    findings.push("runtime motion selection does not match the site brief");
  }
  if (runtime.runtime.intakeMode !== brief.integrations.intake.mode) {
    findings.push("runtime intake mode does not match the site brief");
  }
  if (
    runtime.runtime.intakeDestination !==
    brief.integrations.intake.destination
  ) {
    findings.push("runtime intake destination does not match the site brief");
  }
  if (!same(runtime.runtime.intakeFields, brief.integrations.intake.fields)) {
    findings.push("runtime intake fields do not match the site brief");
  }
  if (runtime.runtime.deploymentProfile !== brief.deployment.profile) {
    findings.push("runtime deployment profile does not match the site brief");
  }
  if (runtime.runtime.basePath !== brief.deployment.basePath) {
    findings.push("runtime base path does not match the site brief");
  }
  if (runtime.runtime.siteUrl !== expectedSiteUrl(brief)) {
    findings.push("runtime site URL does not match the approved deployment domain");
  }
  if (runtime.runtime.indexable !== brief.deployment.indexable) {
    findings.push("runtime indexability does not match the site brief");
  }
  const expectedIdentity =
    brief.business.identity.value || brief.project.workingTitle;
  if (runtime.runtime.identityName !== expectedIdentity) {
    findings.push("runtime identity does not match the site brief");
  }
  if (runtime.runtime.testimonialState !== brief.content.testimonials) {
    findings.push("runtime testimonial state does not match the site brief");
  }
  if (contentManifest.testimonials !== brief.content.testimonials) {
    findings.push("content manifest testimonial state does not match the site brief");
  }
  if (runtime.runtime.contentBinding !== contentManifest.status) {
    findings.push("runtime content binding does not match the content manifest");
  }
  if (runtime.runtime.contentManifestSha256 !== sha256Json(contentManifest)) {
    findings.push("runtime content manifest digest does not match");
  }
  if (
    contentManifest.status === "approved" &&
    !brief.project.owners.includes(contentManifest.approval.owner)
  ) {
    findings.push("content manifest approver is not an approved project owner");
  }
  const approvedContentSource = brief.content.authority.some(
    (source) =>
      source.kind !== "placeholder" &&
      source.kind !== "agent-derived" &&
      same(source, contentManifest.approval.source),
  );
  if (contentManifest.status === "approved" && !approvedContentSource) {
    findings.push(
      "content manifest source does not match an approved content authority",
    );
  }

  const expectedArtifacts = collectContentArtifacts(repositoryRoot);
  if (!same(contentManifest.artifacts, expectedArtifacts)) {
    findings.push("content manifest does not match the client-visible artifacts");
  }
  const paths = contentManifest.artifacts.map((artifact) => artifact.path);
  if (new Set(paths).size !== paths.length) {
    findings.push("content manifest contains duplicate artifact paths");
  }

  const explicitlyEnabledModules = brief.modules
    .filter((module) => module.enabled)
    .map((module) => module.id);
  for (const moduleId of explicitlyEnabledModules) {
    if (!runtime.runtime.enabledModules.includes(moduleId)) {
      findings.push(`runtime is missing enabled module ${moduleId}`);
    }
  }
  const explicitlyDisabledModules = brief.modules
    .filter((module) => !module.enabled)
    .map((module) => module.id);
  for (const moduleId of explicitlyDisabledModules) {
    if (runtime.runtime.enabledModules.includes(moduleId)) {
      findings.push(`runtime includes explicitly disabled module ${moduleId}`);
    }
  }
  const modulesDirectory = path.join(repositoryRoot, "modules");
  if (
    !fs.existsSync(modulesDirectory) ||
    !fs.statSync(modulesDirectory).isDirectory()
  ) {
    findings.push("selected module contracts directory is missing");
  } else {
    const copiedModules = fs
      .readdirSync(modulesDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const manifests = new Map();
    for (const moduleId of copiedModules) {
      const manifestPath = path.join(
        modulesDirectory,
        moduleId,
        "module.json",
      );
      if (!fs.existsSync(manifestPath)) {
        findings.push(`copied module manifest is missing: ${moduleId}`);
        continue;
      }
      manifests.set(
        moduleId,
        JSON.parse(fs.readFileSync(manifestPath, "utf8")),
      );
    }
    const expectedModules = new Set();
    const visit = (moduleId, stack = []) => {
      if (expectedModules.has(moduleId)) return;
      if (stack.includes(moduleId)) {
        findings.push(
          `copied module dependency cycle: ${[...stack, moduleId].join(" -> ")}`,
        );
        return;
      }
      const manifest = manifests.get(moduleId);
      if (!manifest) {
        findings.push(`enabled module contract is missing: ${moduleId}`);
        return;
      }
      for (const dependency of manifest.requires) {
        visit(dependency, [...stack, moduleId]);
      }
      expectedModules.add(moduleId);
    };
    explicitlyEnabledModules.forEach((moduleId) => visit(moduleId));
    if (
      !same(
        [...expectedModules].sort(),
        [...runtime.runtime.enabledModules].sort(),
      )
    ) {
      findings.push(
        "runtime enabled modules do not exactly match the resolved brief selection",
      );
    }
    if (!same(copiedModules, [...runtime.runtime.enabledModules].sort())) {
      findings.push("runtime enabled modules do not match copied module contracts");
    }
  }

  const generatedConfigPath = path.join(
    repositoryRoot,
    "app",
    "src",
    "config",
    "generated-site.json",
  );
  if (!fs.existsSync(generatedConfigPath)) {
    findings.push("generated runtime configuration is missing");
    return [...new Set(findings)];
  }
  const generatedConfig = JSON.parse(
    fs.readFileSync(generatedConfigPath, "utf8"),
  );
  const comparisons = [
    ["foundationVersion", runtime.foundation.version],
    ["foundationCommit", runtime.foundation.commit],
    ["foundationSourceState", runtime.foundation.sourceState],
    ["briefSha256", runtime.brief.sha256],
    ["identityName", runtime.runtime.identityName],
    ["defaultLocale", runtime.runtime.defaultLocale],
    ["locales", runtime.runtime.locales.map(({ locale }) => locale)],
    ["enabledModules", runtime.runtime.enabledModules],
    ["motion", runtime.runtime.motion],
    ["intakeMode", runtime.runtime.intakeMode],
    ["intakeDestination", runtime.runtime.intakeDestination],
    ["intakeFields", runtime.runtime.intakeFields],
    ["deploymentProfile", runtime.runtime.deploymentProfile],
    ["basePath", runtime.runtime.basePath],
    ["siteUrl", runtime.runtime.siteUrl],
    ["indexable", runtime.runtime.indexable],
    ["contentStatus", runtime.runtime.contentBinding],
  ];
  for (const [field, expected] of comparisons) {
    if (!same(generatedConfig[field], expected)) {
      findings.push(`generated runtime config field drifted: ${field}`);
    }
  }

  return [...new Set(findings)];
}
