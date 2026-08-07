import "server-only";

import { z } from "zod";

import { generatedSiteConfig } from "@/config/generated-site";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalHttpsUrl = z
  .union([z.literal(""), z.url({ protocol: /^https$/ })])
  .optional()
  .transform((value) => value || undefined);

const ServerEnvironmentSchema = z
  .object({
    DEPLOYMENT_PROFILE: z
      .enum(["vps-local-build", "ghcr-vps-pull", "static-pages-worker"])
      .default("vps-local-build"),
    INTAKE_MODE: z.enum(["disabled", "webhook"]).default("disabled"),
    INTAKE_ALLOWED_ORIGINS: z.string().default(""),
    INTAKE_WEBHOOK_URL: optionalHttpsUrl,
    INTAKE_WEBHOOK_SIGNING_SECRET: z.string().optional(),
    INTAKE_DUPLICATE_SECRET: z.string().optional(),
    INTAKE_TRUST_PROXY_HEADERS: booleanString,
  })
  .superRefine((environment, context) => {
    if (
      environment.DEPLOYMENT_PROFILE !==
      generatedSiteConfig.deploymentProfile
    ) {
      context.addIssue({
        code: "custom",
        path: ["DEPLOYMENT_PROFILE"],
        message: "Must match the reviewed generated deployment profile",
      });
    }
    const expectedIntakeAdapter =
      generatedSiteConfig.intakeDestination === "none"
        ? "disabled"
        : generatedSiteConfig.intakeDestination === "n8n" ||
            generatedSiteConfig.intakeDestination === "custom"
          ? "webhook"
          : undefined;
    if (!expectedIntakeAdapter) {
      context.addIssue({
        code: "custom",
        path: ["INTAKE_MODE"],
        message:
          "The reviewed intake destination has no supported runtime adapter",
      });
      return;
    }
    if (environment.INTAKE_MODE !== expectedIntakeAdapter) {
      context.addIssue({
        code: "custom",
        path: ["INTAKE_MODE"],
        message:
          generatedSiteConfig.intakeDestination === "none"
            ? "Must stay disabled when generated intake is disabled"
            : "Must configure the webhook adapter for the reviewed n8n or custom intake destination",
      });
    }

    for (const [index, origin] of environment.INTAKE_ALLOWED_ORIGINS.split(
      ",",
    ).entries()) {
      const value = origin.trim();
      if (!value) {
        continue;
      }
      try {
        const parsed = new URL(value);
        if (
          !["http:", "https:"].includes(parsed.protocol) ||
          parsed.origin !== value
        ) {
          throw new Error("not an origin");
        }
      } catch {
        context.addIssue({
          code: "custom",
          path: ["INTAKE_ALLOWED_ORIGINS", index],
          message: "Must contain comma-separated HTTP(S) origins",
        });
      }
    }

    if (environment.INTAKE_MODE !== "webhook") {
      return;
    }
    const reviewedOrigin = new URL(generatedSiteConfig.siteUrl).origin;
    const configuredOrigins = environment.INTAKE_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (
      configuredOrigins.length > 0 &&
      !configuredOrigins.includes(reviewedOrigin)
    ) {
      context.addIssue({
        code: "custom",
        path: ["INTAKE_ALLOWED_ORIGINS"],
        message: "Must include the reviewed public site origin",
      });
    }
    if (!environment.INTAKE_WEBHOOK_URL) {
      context.addIssue({
        code: "custom",
        path: ["INTAKE_WEBHOOK_URL"],
        message: "Required when intake is enabled",
      });
    }
    for (const key of [
      "INTAKE_WEBHOOK_SIGNING_SECRET",
      "INTAKE_DUPLICATE_SECRET",
    ] as const) {
      if ((environment[key]?.length ?? 0) < 16) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: "Must contain at least 16 characters when intake is enabled",
        });
      }
    }
  });

export type ServerEnvironment = z.infer<typeof ServerEnvironmentSchema>;

let cached:
  | { success: true; data: ServerEnvironment }
  | { success: false; variableNames: readonly string[] }
  | undefined;

function parseEnvironment() {
  if (cached) {
    return cached;
  }

  const result = ServerEnvironmentSchema.safeParse(process.env);
  if (result.success) {
    cached = { success: true, data: result.data };
    return cached;
  }

  cached = {
    success: false,
    variableNames: [
      ...new Set(
        result.error.issues.map((issue) => String(issue.path[0] ?? "unknown")),
      ),
    ],
  };
  return cached;
}

export function getServerEnvironment(): ServerEnvironment {
  const result = parseEnvironment();
  if (!result.success) {
    throw new Error(
      `Invalid server environment variables: ${result.variableNames.join(", ")}`,
    );
  }
  return result.data;
}

export function isServerEnvironmentReady(): boolean {
  return parseEnvironment().success;
}
