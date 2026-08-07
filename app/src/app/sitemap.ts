import type { MetadataRoute } from "next";

import {
  generatedSiteConfig,
  isFixtureContent,
} from "@/config/generated-site";
import { localeRootPath } from "@/lib/locale-href";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!generatedSiteConfig.indexable || isFixtureContent) {
    return [];
  }
  // ⚠️ NO `/<locale>` IN THE URL. Hebrew-only, served from the root: the export
  // is hoisted out of out/he/ after the build and the links are unprefixed to
  // match. See lib/locale-href.ts. A sitemap that still advertised /he/ would
  // be pointing a crawler at the one URL that no longer exists.
  return generatedSiteConfig.locales.map((locale) => ({
    url: new URL(
      `${generatedSiteConfig.basePath}${localeRootPath()}`,
      generatedSiteConfig.siteUrl,
    ).toString(),
    changeFrequency: "monthly",
    priority: locale === generatedSiteConfig.defaultLocale ? 1 : 0.9,
  }));
}
