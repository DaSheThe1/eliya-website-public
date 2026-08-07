import type { MetadataRoute } from "next";

import {
  generatedLocalePath,
  generatedSiteConfig,
  isFixtureContent,
} from "@/config/generated-site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!generatedSiteConfig.indexable || isFixtureContent) {
    return [];
  }
  return generatedSiteConfig.locales.map((locale) => ({
    url: new URL(
      `${generatedSiteConfig.basePath}${generatedLocalePath(locale)}`,
      generatedSiteConfig.siteUrl,
    ).toString(),
    changeFrequency: "monthly",
    priority: locale === generatedSiteConfig.defaultLocale ? 1 : 0.9,
  }));
}
