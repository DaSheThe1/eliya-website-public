import type { NextConfig } from "next";

import generatedSiteConfig from "./src/config/generated-site.json";

const staticExportValue = process.env.STATIC_EXPORT;
if (
  staticExportValue !== undefined &&
  !["true", "false"].includes(staticExportValue)
) {
  throw new Error("STATIC_EXPORT must be either true or false when provided.");
}
const staticExportRequested = staticExportValue === "true";
const moduleValidationRequested =
  process.env.npm_lifecycle_event === "test:e2e:module";
const staticCompatible =
  process.env.FOUNDATION_STATIC_COMPATIBLE?.trim() === "true";
const publicSiteUrlOverride =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
const reviewedSiteUrl = generatedSiteConfig.siteUrl.replace(/\/$/, "");
const defaultLocaleOverride =
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.trim();
const defaultLocale = generatedSiteConfig.defaultLocale;

if (
  defaultLocaleOverride &&
  !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(defaultLocaleOverride)
) {
  throw new Error("NEXT_PUBLIC_DEFAULT_LOCALE must be a valid locale code.");
}
if (
  defaultLocaleOverride &&
  defaultLocaleOverride !== generatedSiteConfig.defaultLocale
) {
  throw new Error(
    "NEXT_PUBLIC_DEFAULT_LOCALE must match the reviewed generated default locale.",
  );
}
if (!(generatedSiteConfig.locales as readonly string[]).includes(defaultLocale)) {
  throw new Error("The generated default locale must be enabled.");
}

if (staticExportRequested && !staticCompatible) {
  throw new Error(
    [
      "Static export is not available from the server-enabled reference template.",
      "Generate the static-pages-worker profile without API route and proxy modules.",
      "The build deliberately does not delete or rewrite source files.",
    ].join(" "),
  );
}

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.trim() || generatedSiteConfig.basePath;
if (
  process.env.NODE_ENV === "production" &&
  publicSiteUrlOverride &&
  publicSiteUrlOverride !== reviewedSiteUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL must match the reviewed generated site URL.",
  );
}
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined &&
  process.env.NEXT_PUBLIC_BASE_PATH.trim() !== generatedSiteConfig.basePath
) {
  throw new Error(
    "NEXT_PUBLIC_BASE_PATH must match the reviewed generated base path.",
  );
}
if (basePath && !/^\/[a-zA-Z0-9/_-]*[a-zA-Z0-9_-]$/.test(basePath)) {
  throw new Error(
    "NEXT_PUBLIC_BASE_PATH must be empty or an absolute path without a trailing slash.",
  );
}

const localeRedirect: Pick<NextConfig, "redirects"> = staticExportRequested
  ? {}
  : {
      async redirects() {
        return [
          {
            source: "/",
            destination: `/${defaultLocale}`,
            permanent: false,
          },
        ];
      },
    };

const nextConfig: NextConfig = {
  /*
   * The dev-tools badge is a fixed overlay pinned to the bottom-left corner in
   * development, which is exactly where the accessibility launcher sits. It sat
   * ON TOP of that button: unclickable in a browser and an unexplained click
   * timeout in the browser tests. It is dev-only chrome and it must not dictate
   * where a real control can live.
   */
  devIndicators: false,
  ...localeRedirect,
  allowedDevOrigins: ["127.0.0.1"],
  distDir: moduleValidationRequested ? "dist/module-validation" : undefined,
  output: staticExportRequested ? "export" : "standalone",
  basePath,
  images: staticExportRequested ? { unoptimized: true } : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: staticExportRequested,
  typedRoutes: true,
  transpilePackages: [
    "@foundation/accessibility",
    "@foundation/analytics",
    "@foundation/design-tokens",
    "@foundation/intake",
    "@foundation/seo",
    "@foundation/site-contract",
    "@foundation/ui",
  ],
};

export default nextConfig;
