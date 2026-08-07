import generatedSiteConfig from "../src/config/generated-site.json";

export type SupportedLocale = "he";
export type SupportedIntakeField =
  | "serviceId"
  | "name"
  | "phone"
  | "email"
  | "message"
  | "timeWindow";
const configuredIntakeFields =
  generatedSiteConfig.intakeFields as Partial<
    Record<SupportedIntakeField, boolean>
  >;

const configuredBasePath =
  process.env.PLAYWRIGHT_BASE_PATH === undefined
    ? generatedSiteConfig.basePath
    : process.env.PLAYWRIGHT_BASE_PATH.trim();
const configuredPort = process.env.PLAYWRIGHT_PORT?.trim() || "3000";
if (
  !/^\d{1,5}$/.test(configuredPort) ||
  Number(configuredPort) < 1 ||
  Number(configuredPort) > 65_535
) {
  throw new Error("PLAYWRIGHT_PORT must be a valid TCP port.");
}

export const testSite = {
  basePath: configuredBasePath,
  contentStatus: generatedSiteConfig.contentStatus,
  defaultLocale: generatedSiteConfig.defaultLocale as SupportedLocale,
  deploymentProfile: generatedSiteConfig.deploymentProfile,
  enabledModules: generatedSiteConfig.enabledModules,
  indexable: generatedSiteConfig.indexable,
  intakeFields: configuredIntakeFields,
  intakeMode: generatedSiteConfig.intakeMode,
  locales: generatedSiteConfig.locales as SupportedLocale[],
  motion: generatedSiteConfig.motion,
  reviewedBasePath: generatedSiteConfig.basePath,
  siteUrl: generatedSiteConfig.siteUrl,
  staticExport: process.env.STATIC_EXPORT?.trim() === "true",
} as const;

export const hasIntakeModule =
  testSite.enabledModules.includes("lead-form") ||
  testSite.enabledModules.includes("booking-form");

export const hasServerApi =
  testSite.deploymentProfile !== "static-pages-worker";

export const referenceOrigin = `http://127.0.0.1:${configuredPort}`;
export const testPort = configuredPort;

export function hasModule(moduleId: string): boolean {
  return testSite.enabledModules.includes(moduleId);
}

export function hasIntakeField(field: SupportedIntakeField): boolean {
  return Object.prototype.hasOwnProperty.call(testSite.intakeFields, field);
}

export function isRequiredIntakeField(field: SupportedIntakeField): boolean {
  return testSite.intakeFields[field] === true;
}

export function pagePath(locale: SupportedLocale): string {
  return `${testSite.basePath}/${locale}`;
}

export function target(baseURL: string | undefined, path: string): string {
  return `${baseURL ?? `${referenceOrigin}${testSite.basePath}`}${path}`;
}
