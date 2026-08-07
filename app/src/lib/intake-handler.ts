import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import {
  MemoryDuplicateStore,
  MemoryRateLimiter,
  createIntakeHandler,
  createWebhookDelivery,
  type IntakeHandler,
} from "@foundation/intake";

import { generatedSiteConfig } from "@/config/generated-site";
import { intakeConfig } from "@/config/intake";
import { siteConfig } from "@/config/site";

import { getServerEnvironment } from "./env";

let cachedHandler: IntakeHandler | null | undefined;

function allowedOrigins(value: string): string[] {
  const configured = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length > 0
    ? configured
    : [new URL(siteConfig.siteUrl).origin];
}

function clientKey(request: Request, secret: string, trustProxy: boolean) {
  const raw = trustProxy
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unresolved-client"
    : "shared-unresolved-client";
  return createHmac("sha256", secret)
    .update("client-key\u0000")
    .update(raw)
    .digest("hex");
}

export function getTemplateIntakeHandler(): IntakeHandler | null {
  if (cachedHandler !== undefined) {
    return cachedHandler;
  }

  let environment: ReturnType<typeof getServerEnvironment>;
  try {
    environment = getServerEnvironment();
  } catch {
    cachedHandler = null;
    return cachedHandler;
  }
  if (environment.INTAKE_MODE === "disabled") {
    cachedHandler = null;
    return cachedHandler;
  }

  const duplicateSecret = environment.INTAKE_DUPLICATE_SECRET as string;
  cachedHandler = createIntakeHandler({
    allowedOrigins: allowedOrigins(environment.INTAKE_ALLOWED_ORIGINS),
    duplicateSecret,
    expectedType: intakeConfig.defaultType,
    intakeFields: generatedSiteConfig.intakeFields,
    duplicateStore: new MemoryDuplicateStore(5 * 60_000, 10_000),
    rateLimiter: new MemoryRateLimiter(
      environment.INTAKE_TRUST_PROXY_HEADERS ? 5 : 100,
      60_000,
      10_000,
    ),
    resolveClientKey: (request) =>
      clientKey(
        request,
        duplicateSecret,
        environment.INTAKE_TRUST_PROXY_HEADERS,
      ),
    requestIdFactory: randomUUID,
    delivery: createWebhookDelivery({
      url: environment.INTAKE_WEBHOOK_URL as string,
      signingSecret: environment.INTAKE_WEBHOOK_SIGNING_SECRET as string,
    }),
    logger(diagnostic) {
      if (diagnostic.outcome === "delivery_failed") {
        console.error("[intake]", diagnostic);
      }
    },
  });
  return cachedHandler;
}
