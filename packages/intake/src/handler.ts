import { randomUUID } from "node:crypto";

import { BodyReadError, readBoundedJson } from "./body";
import type { DuplicateStore, RateLimiter } from "./memory";
import {
  isAllowedRequestOrigin,
  normalizeAllowedOrigins,
} from "./origin";
import { createSubmissionFingerprint } from "./privacy";
import {
  safeParseConfiguredIntakeSubmission,
  type ForwardableIntakeSubmission,
  type IntakeFieldContract,
  type IntakeSubmission,
  type SubmissionType,
} from "./schema";
import type { IntakeDelivery } from "./webhook";

export type IntakeResponseStatus =
  | "accepted"
  | "invalid_request"
  | "rate_limited"
  | "temporarily_unavailable";

export interface IntakeResponseBody {
  status: IntakeResponseStatus;
  message: string;
  requestId: string;
}

export const intakeResponseMessages: Readonly<
  Record<IntakeResponseStatus, string>
> = {
  accepted: "Request received.",
  invalid_request: "The request could not be processed.",
  rate_limited: "Please wait before trying again.",
  temporarily_unavailable: "The service is temporarily unavailable.",
};

export type IntakeDiagnostic = Readonly<{
  event: "intake_request";
  outcome:
    | "accepted"
    | "duplicate"
    | "honeypot"
    | "invalid"
    | "blocked_origin"
    | "rate_limited"
    | "delivery_failed";
  requestId: string;
  reason?: string;
}>;

export type IntakeLogger = (diagnostic: IntakeDiagnostic) => void;

export interface IntakeHandlerOptions {
  allowedOrigins: readonly string[];
  delivery: IntakeDelivery;
  duplicateSecret: string;
  expectedType: SubmissionType;
  intakeFields: IntakeFieldContract;
  duplicateStore?: DuplicateStore;
  rateLimiter?: RateLimiter;
  allowMissingOrigin?: boolean;
  maximumBodyBytes?: number;
  now?: () => number;
  requestIdFactory?: () => string;
  resolveClientKey?: (request: Request) => string | Promise<string>;
  logger?: IntakeLogger;
}

export type IntakeHandler = (request: Request) => Promise<Response>;

function response(
  status: IntakeResponseStatus,
  requestId: string,
  httpStatus: number,
  retryAfterSeconds?: number,
): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  });
  if (retryAfterSeconds !== undefined) {
    headers.set("retry-after", String(retryAfterSeconds));
  }
  const body: IntakeResponseBody = {
    status,
    message: intakeResponseMessages[status],
    requestId,
  };
  return new Response(JSON.stringify(body), { status: httpStatus, headers });
}

function stripHoneypot(
  submission: IntakeSubmission,
): ForwardableIntakeSubmission {
  const { website: _website, ...forwardable } = submission;
  return Object.fromEntries(
    Object.entries(forwardable).filter(([, value]) => value !== undefined),
  ) as ForwardableIntakeSubmission;
}

function safeLog(logger: IntakeLogger | undefined, value: IntakeDiagnostic) {
  try {
    logger?.(value);
  } catch {
    // Diagnostics must never affect intake delivery.
  }
}

export function createIntakeHandler(
  options: IntakeHandlerOptions,
): IntakeHandler {
  const allowedOrigins = normalizeAllowedOrigins(options.allowedOrigins);
  const maximumBodyBytes = options.maximumBodyBytes ?? 16 * 1_024;
  if (
    !Number.isSafeInteger(maximumBodyBytes) ||
    maximumBodyBytes < 1_024 ||
    maximumBodyBytes > 64 * 1_024
  ) {
    throw new Error("Maximum body size must be between 1024 and 65536 bytes");
  }
  if (options.duplicateSecret.length < 16) {
    throw new Error("Duplicate fingerprint secret must be at least 16 characters");
  }

  const now = options.now ?? Date.now;
  const requestIdFactory = options.requestIdFactory ?? randomUUID;
  const resolveClientKey =
    options.resolveClientKey ?? (() => "unresolved-client");

  return async (request) => {
    const requestId = requestIdFactory();
    const diagnostic = (value: Omit<IntakeDiagnostic, "event" | "requestId">) =>
      safeLog(options.logger, {
        event: "intake_request",
        requestId,
        ...value,
      });

    if (request.method !== "POST") {
      diagnostic({ outcome: "invalid", reason: "method" });
      return response("invalid_request", requestId, 405);
    }

    if (
      !isAllowedRequestOrigin(
        request,
        allowedOrigins,
        options.allowMissingOrigin ?? false,
      )
    ) {
      diagnostic({ outcome: "blocked_origin" });
      return response("invalid_request", requestId, 403);
    }

    let raw: unknown;
    try {
      raw = await readBoundedJson(request, maximumBodyBytes);
    } catch (error) {
      const reason =
        error instanceof BodyReadError ? error.code : "body_read_error";
      diagnostic({ outcome: "invalid", reason });
      return response(
        "invalid_request",
        requestId,
        reason === "payload_too_large" ? 413 : 400,
      );
    }

    const parsed = safeParseConfiguredIntakeSubmission(
      raw,
      options.intakeFields,
      options.expectedType,
    );
    if (!parsed.success) {
      diagnostic({ outcome: "invalid", reason: "schema" });
      return response("invalid_request", requestId, 400);
    }

    if (parsed.data.website.length > 0) {
      diagnostic({ outcome: "honeypot" });
      return response("accepted", requestId, 202);
    }

    const timestamp = now();
    if (options.rateLimiter) {
      try {
        const clientKey = await resolveClientKey(request);
        const limit = await options.rateLimiter.consume(clientKey, timestamp);
        if (!limit.allowed) {
          diagnostic({ outcome: "rate_limited" });
          return response(
            "rate_limited",
            requestId,
            429,
            limit.retryAfterSeconds,
          );
        }
      } catch {
        diagnostic({
          outcome: "delivery_failed",
          reason: "protection_unavailable",
        });
        return response("temporarily_unavailable", requestId, 503);
      }
    }

    const submission = stripHoneypot(parsed.data);
    let fingerprint: string | undefined;
    if (options.duplicateStore) {
      try {
        fingerprint = createSubmissionFingerprint(
          submission,
          options.duplicateSecret,
        );
        const claimed = await options.duplicateStore.claim(
          fingerprint,
          timestamp,
        );
        if (!claimed) {
          diagnostic({ outcome: "duplicate" });
          return response("accepted", requestId, 202);
        }
      } catch {
        diagnostic({
          outcome: "delivery_failed",
          reason: "protection_unavailable",
        });
        return response("temporarily_unavailable", requestId, 503);
      }
    }

    try {
      await options.delivery(submission, {
        requestId,
        receivedAt: new Date(timestamp).toISOString(),
      });
    } catch {
      if (fingerprint && options.duplicateStore) {
        try {
          await options.duplicateStore.release(fingerprint);
        } catch {
          // The response remains unavailable; no storage detail is exposed.
        }
      }
      diagnostic({ outcome: "delivery_failed" });
      return response("temporarily_unavailable", requestId, 503);
    }

    diagnostic({ outcome: "accepted" });
    return response("accepted", requestId, 202);
  };
}
