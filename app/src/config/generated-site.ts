import generatedSite from "./generated-site.json";

interface GeneratedSiteConfig {
  foundationVersion: string;
  foundationCommit: string;
  foundationSourceState: "clean" | "reference" | "uncommitted";
  briefSha256: string;
  identityName: string;
  defaultLocale: "en" | "he";
  locales: Array<"en" | "he">;
  enabledModules: string[];
  motion: "none" | "subtle" | "expressive" | "experimental";
  intakeMode: "none" | "lead" | "booking";
  intakeDestination: "none" | "n8n" | "external-booking" | "custom";
  intakeFields: Partial<
    Record<
      "serviceId" | "name" | "phone" | "email" | "message" | "timeWindow",
      boolean
    >
  >;
  deploymentProfile:
    | "vps-local-build"
    | "ghcr-vps-pull"
    | "static-pages-worker";
  basePath: string;
  siteUrl: string;
  indexable: boolean;
  contentStatus: "approved" | "fixture";
}

/**
 * Client-safe values materialized by the foundation generator.
 */
export const generatedSiteConfig = generatedSite as GeneratedSiteConfig;

export type GeneratedLocale = GeneratedSiteConfig["locales"][number];
export type GeneratedModule = string;

export function hasGeneratedModule(moduleId: string): boolean {
  return generatedSiteConfig.enabledModules.includes(moduleId);
}

export function generatedLocalePath(locale: GeneratedLocale): string {
  const suffix =
    generatedSiteConfig.deploymentProfile === "static-pages-worker" ? "/" : "";
  return `/${locale}${suffix}`;
}

export const isFixtureContent =
  generatedSiteConfig.contentStatus === "fixture";
