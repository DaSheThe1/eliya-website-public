import { parseSiteConfig } from "@foundation/site-contract";

import {
  generatedSiteConfig,
  isFixtureContent,
} from "./generated-site";

const publicSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || generatedSiteConfig.siteUrl;
const publicBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.trim() || generatedSiteConfig.basePath;
const defaultLocale = generatedSiteConfig.defaultLocale as "en" | "he";

/**
 * Client-safe configuration only. Never add webhook destinations, credentials,
 * or other server values to this object.
 */
export const siteConfig = parseSiteConfig({
  contractVersion: "1.0",
  identity: {
    name: generatedSiteConfig.identityName,
  },
  locale: defaultLocale,
  direction: defaultLocale === "he" ? ("rtl" as const) : ("ltr" as const),
  siteUrl: publicSiteUrl,
  basePath: publicBasePath,
  routes: [
    {
      id: "home",
      path: "/",
      label: "Home",
      indexable: generatedSiteConfig.indexable && !isFixtureContent,
      sitemapPriority: 1,
      changeFrequency: "monthly",
    },
  ],
  seo: {
    title: generatedSiteConfig.identityName,
    description:
      "A client-neutral preview used to verify the reusable landing-page foundation.",
  },
});
