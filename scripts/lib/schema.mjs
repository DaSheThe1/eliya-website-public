import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "../..");

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
});
addFormats(ajv);
const validators = new Map();
const supportedTemplateLocales = new Set(["en", "he"]);
const supportedTemplateDirections = new Map([
  ["en", "ltr"],
  ["he", "rtl"],
]);

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function schemaPath(name) {
  return path.join(repositoryRoot, "schemas", name);
}

export function compileSchema(documentPath) {
  const key = path.resolve(documentPath);
  if (!validators.has(key)) {
    const schema = readJson(key);
    const existing = schema.$id ? ajv.getSchema(schema.$id) : undefined;
    validators.set(key, existing ?? ajv.compile(schema));
  }
  return validators.get(key);
}

function decodePointerToken(token) {
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

function valueAtPointer(document, pointer) {
  let value = document;
  for (const token of pointer.slice(1).split("/").map(decodePointerToken)) {
    if (
      value === null ||
      typeof value !== "object" ||
      !Object.prototype.hasOwnProperty.call(value, token)
    ) {
      return { found: false, value: undefined };
    }
    value = value[token];
  }
  return { found: true, value };
}

function requiredDecisionPointers(brief) {
  return [
    "/localization/defaultLocale",
    ...brief.localization.locales.map(
      (_locale, index) => `/localization/locales/${index}`,
    ),
    "/content/copyStatus",
    "/content/mediaStatus",
    "/content/testimonials",
    "/design/direction",
    "/design/motion",
    "/design/accessibility",
    "/conversion/primary",
    ...brief.conversion.secondary.map(
      (_conversion, index) => `/conversion/secondary/${index}`,
    ),
    ...brief.routes.map((_route, index) => `/routes/${index}`),
    ...brief.modules.map((_module, index) => `/modules/${index}`),
    "/integrations/intake",
    "/integrations/analytics",
    "/integrations/media",
    "/integrations/privacy",
    "/deployment",
  ];
}

function validateSiteBriefSemantics(brief, documentPath) {
  const findings = [];
  const locales = brief.localization.locales.map(({ locale }) => locale);
  if (new Set(locales).size !== locales.length) {
    findings.push("localization.locales contains duplicate locale identifiers");
  }
  if (!locales.includes(brief.localization.defaultLocale)) {
    findings.push("localization.defaultLocale must appear in localization.locales");
  }
  const unsupportedLocales = locales.filter(
    (locale) => !supportedTemplateLocales.has(locale),
  );
  if (unsupportedLocales.length > 0) {
    findings.push(
      `the current template does not implement locale(s): ${unsupportedLocales.join(", ")}`,
    );
  }
  for (const { locale, direction } of brief.localization.locales) {
    const supportedDirection = supportedTemplateDirections.get(locale);
    if (supportedDirection && direction !== supportedDirection) {
      findings.push(
        `template locale ${locale} requires ${supportedDirection} direction`,
      );
    }
  }
  if (
    brief.deployment.domain !== null &&
    (!/^[a-z0-9.-]+$/i.test(brief.deployment.domain) ||
      brief.deployment.domain.startsWith(".") ||
      brief.deployment.domain.endsWith(".") ||
      brief.deployment.domain.includes(".."))
  ) {
    findings.push("deployment.domain must be a plain DNS hostname");
  }
  const intakeFieldCount = Object.keys(brief.integrations.intake.fields).length;
  if (brief.integrations.intake.mode === "none" && intakeFieldCount !== 0) {
    findings.push("integrations.intake.fields must be empty when mode is none");
  }
  if (
    brief.integrations.intake.mode === "none" &&
    brief.integrations.intake.destination !== "none"
  ) {
    findings.push(
      "integrations.intake.destination must be none when mode is none",
    );
  }
  if (brief.integrations.intake.mode !== "none" && intakeFieldCount === 0) {
    findings.push(
      "integrations.intake.fields must select at least one supported field",
    );
  }
  if (
    brief.integrations.intake.mode !== "none" &&
    brief.integrations.intake.destination === "none"
  ) {
    findings.push(
      "integrations.intake.destination cannot be none when intake is enabled",
    );
  }
  const moduleIds = new Set();
  for (const module of brief.modules) {
    if (moduleIds.has(module.id)) {
      findings.push(`duplicate module selection: ${module.id}`);
    }
    moduleIds.add(module.id);
  }

  const decisionIds = new Set();
  const decisionPointers = new Set();
  for (const decision of brief.decisions) {
    if (decisionIds.has(decision.id)) {
      findings.push(`duplicate decision id: ${decision.id}`);
    }
    decisionIds.add(decision.id);
    if (decisionPointers.has(decision.pointer)) {
      findings.push(`duplicate decision pointer: ${decision.pointer}`);
    }
    decisionPointers.add(decision.pointer);

    const target = valueAtPointer(brief, decision.pointer);
    if (!target.found) {
      findings.push(`decision ${decision.id} points to a missing value`);
    } else if (
      target.value &&
      typeof target.value === "object" &&
      typeof target.value.status === "string" &&
      target.value.status !== decision.status
    ) {
      findings.push(
        `decision ${decision.id} status does not match ${decision.pointer}`,
      );
    }
    if (
      decision.approval.status === "approved" &&
      decision.approval.approvedAt === null
    ) {
      findings.push(`decision ${decision.id} is approved without approvedAt`);
    }
    if (
      decision.approval.status !== "approved" &&
      decision.approval.approvedAt !== null
    ) {
      findings.push(
        `decision ${decision.id} has approvedAt without approved status`,
      );
    }
  }

  for (const pointer of requiredDecisionPointers(brief)) {
    if (!decisionPointers.has(pointer)) {
      findings.push(`missing decision provenance for ${pointer}`);
    }
  }

  for (const claim of brief.content.claims) {
    if (claim.approval.status === "approved" && claim.approval.approvedAt === null) {
      findings.push(`claim ${claim.id} is approved without approvedAt`);
    }
    if (
      claim.approval.status !== "approved" &&
      claim.approval.approvedAt !== null
    ) {
      findings.push(`claim ${claim.id} has approvedAt without approved status`);
    }
  }

  if (findings.length > 0) {
    throw new Error(
      `${documentPath} failed site brief semantic validation:\n${findings
        .map((finding) => `- ${finding}`)
        .join("\n")}`,
    );
  }
}

function validateReviewHandoffSemantics(review, documentPath) {
  const findings = [];
  const blockingCheckEvidence = review.checks.some(
    ({ status, notes }) => status !== "passed" && notes.trim().length > 0,
  );
  const unresolvedEvidence = review.unresolved.some(
    (item) => item.trim().length > 0,
  );

  if (review.status === "pass") {
    if (review.checks.length === 0) {
      findings.push("a passing review must record at least one check");
    }
    if (review.checks.some(({ status }) => status !== "passed")) {
      findings.push("a passing review may contain only passed checks");
    }
    if (review.findings.length > 0) {
      findings.push("a passing review may not contain findings");
    }
    if (review.unresolved.length > 0) {
      findings.push("a passing review may not contain unresolved items");
    }
  }

  if (
    review.status === "blocked" &&
    !unresolvedEvidence &&
    !blockingCheckEvidence
  ) {
    findings.push(
      "a blocked review must explain a failed or skipped check, or record a non-empty unresolved item",
    );
  }

  if (findings.length > 0) {
    throw new Error(
      `${documentPath} failed review handoff semantic validation:\n${findings
        .map((finding) => `- ${finding}`)
        .join("\n")}`,
    );
  }
}

function validateImplementerHandoffSemantics(handoff, documentPath) {
  const findings = [];
  if (handoff.status === "complete") {
    if (handoff.checks.length === 0) {
      findings.push("a complete handoff must record at least one check");
    }
    if (handoff.checks.some(({ status }) => status !== "passed")) {
      findings.push("a complete handoff may contain only passed checks");
    }
    if (handoff.changedFiles.length === 0) {
      findings.push("a complete handoff must report at least one changed file");
    }
    if (handoff.contractChanges.length > 0) {
      findings.push("a complete handoff may not contain contract changes");
    }
    if (handoff.unresolved.length > 0) {
      findings.push("a complete handoff may not contain unresolved items");
    }
  }
  if (findings.length > 0) {
    throw new Error(
      `${documentPath} failed implementer handoff semantic validation:\n${findings
        .map((finding) => `- ${finding}`)
        .join("\n")}`,
    );
  }
}

export function validateJson(
  documentPath,
  schemaFile,
  { schemasDirectory = path.join(repositoryRoot, "schemas") } = {},
) {
  const document = readJson(documentPath);
  const validatorKey = path.join(path.resolve(schemasDirectory), schemaFile);
  let validate = validators.get(validatorKey);

  if (!validate) {
    const schema = readJson(path.join(schemasDirectory, schemaFile));
    const isolatedAjv = new Ajv2020({
      allErrors: true,
      strict: true,
    });
    addFormats(isolatedAjv);
    validate = isolatedAjv.compile(schema);
    validators.set(validatorKey, validate);
  }

  if (!validate(document)) {
    const details = (validate.errors ?? [])
      .map((error) => `${error.instancePath || "/"} ${error.message}`)
      .join("\n");
    throw new Error(`${documentPath} failed ${schemaFile}:\n${details}`);
  }

  if (schemaFile === "site-brief.schema.json") {
    validateSiteBriefSemantics(document, documentPath);
  }
  if (schemaFile === "review-handoff.schema.json") {
    validateReviewHandoffSemantics(document, documentPath);
  }
  if (schemaFile === "handoff.schema.json") {
    validateImplementerHandoffSemantics(document, documentPath);
  }

  return document;
}
