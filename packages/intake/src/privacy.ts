import { createHmac } from "node:crypto";

import type { ForwardableIntakeSubmission } from "./schema";

function canonicalizeSubmission(
  submission: ForwardableIntakeSubmission,
): string {
  return JSON.stringify([
    submission.contractVersion,
    submission.type,
    submission.name,
    submission.phone ?? null,
    submission.email ?? null,
    submission.message ?? null,
    submission.serviceId ?? null,
    submission.timeWindow ?? null,
    submission.locale,
    submission.pagePath,
  ]);
}

export function createSubmissionFingerprint(
  submission: ForwardableIntakeSubmission,
  secret: string,
): string {
  if (secret.length < 16) {
    throw new Error("Duplicate fingerprint secret must be at least 16 characters");
  }
  return createHmac("sha256", secret)
    .update(canonicalizeSubmission(submission))
    .digest("hex");
}

const sensitiveKey =
  /name|phone|email|message|website|secret|token|authorization|url|origin|ip|user.?agent/i;
const safeStringKey = /^(event|outcome|reason|status|code|requestId)$/;

export type RedactedDiagnosticValue =
  | string
  | number
  | boolean
  | null
  | RedactedDiagnosticValue[]
  | { [key: string]: RedactedDiagnosticValue };

export function redactDiagnostic(
  value: unknown,
  key = "",
): RedactedDiagnosticValue {
  if (sensitiveKey.test(key)) {
    return "[redacted]";
  }
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "string") {
    return safeStringKey.test(key) ? value : "[redacted]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactDiagnostic(item));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, item]) => [
        entryKey,
        redactDiagnostic(item, entryKey),
      ]),
    );
  }
  return String(value);
}
