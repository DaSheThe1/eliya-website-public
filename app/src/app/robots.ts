import type { MetadataRoute } from "next";

import {
  generatedSiteConfig,
  isFixtureContent,
} from "@/config/generated-site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = new URL(
    generatedSiteConfig.basePath || "/",
    generatedSiteConfig.siteUrl,
  );
  const indexable = generatedSiteConfig.indexable && !isFixtureContent;
  return {
    rules: indexable
      ? {
          userAgent: "*",
          allow: generatedSiteConfig.basePath || "/",
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    ...(indexable
      ? {
          sitemap: new URL(
            `${generatedSiteConfig.basePath}/sitemap.xml`,
            generatedSiteConfig.siteUrl,
          ).toString(),
        }
      : {}),
    host: baseUrl.origin,
  };
}
