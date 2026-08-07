import { createHmac } from "node:crypto";

import type { ForwardableIntakeSubmission } from "./schema";

export interface DeliveryContext {
  requestId: string;
  receivedAt: string;
}

export type IntakeDelivery = (
  submission: ForwardableIntakeSubmission,
  context: DeliveryContext,
) => Promise<void>;

export interface WebhookDeliveryOptions {
  url: string;
  signingSecret: string;
  timeoutMs?: number;
  allowHttpLocalhost?: boolean;
  fetchImplementation?: typeof fetch;
}

export class WebhookDeliveryError extends Error {
  constructor(
    readonly code: "timeout" | "network_error" | "destination_rejected",
  ) {
    super(code);
    this.name = "WebhookDeliveryError";
  }
}

function validateDestination(
  value: string,
  allowHttpLocalhost: boolean,
): URL {
  const url = new URL(value);
  const localHttp =
    allowHttpLocalhost &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error("Webhook destination must use HTTPS");
  }
  if (url.username || url.password) {
    throw new Error("Webhook destination must not contain credentials");
  }
  return url;
}

export function createWebhookDelivery(
  options: WebhookDeliveryOptions,
): IntakeDelivery {
  const destination = validateDestination(
    options.url,
    options.allowHttpLocalhost ?? false,
  );
  if (options.signingSecret.length < 16) {
    throw new Error("Webhook signing secret must be at least 16 characters");
  }
  const timeoutMs = options.timeoutMs ?? 8_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 250 || timeoutMs > 30_000) {
    throw new Error("Webhook timeout must be between 250 and 30000 milliseconds");
  }
  const fetchImplementation = options.fetchImplementation ?? fetch;

  return async (submission, context) => {
    const body = JSON.stringify({
      ...submission,
      requestId: context.requestId,
      receivedAt: context.receivedAt,
    });
    const signature = createHmac("sha256", options.signingSecret)
      .update(body)
      .digest("hex");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImplementation(destination, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-foundation-signature": `sha256=${signature}`,
          "x-request-id": context.requestId,
        },
        body,
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
      await response.body?.cancel();
      if (!response.ok) {
        throw new WebhookDeliveryError("destination_rejected");
      }
    } catch (error) {
      if (error instanceof WebhookDeliveryError) {
        throw error;
      }
      if (controller.signal.aborted) {
        throw new WebhookDeliveryError("timeout");
      }
      throw new WebhookDeliveryError("network_error");
    } finally {
      clearTimeout(timeout);
    }
  };
}
