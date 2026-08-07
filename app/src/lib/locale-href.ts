import { generatedSiteConfig } from "@/config/generated-site";

import { siteUrl } from "./site-url";

/**
 * A link to a page of this site, without the locale segment.
 *
 * ⚠️ THE SITE IS HEBREW-ONLY AND IS SERVED FROM THE ROOT.
 *
 * Daniel, 2026-08-07: *"you misunderstood me when I told you to do the same as
 * Pnina but we're not doing /he. This is a Hebrew-only website so no need.
 * We're going to serve it straight from https://eliya.trickticmedia.com/"*
 *
 * The App Router needs the `[locale]` segment to exist — it is what
 * `generateStaticParams` iterates and what every page reads its content from —
 * so the export still lands in `out/he/`. `scripts/flatten-locale-export.mjs`
 * hoists that to `out/` after the build, and this is the other half: the links
 * in the HTML have to agree with where the files ended up, or every one of them
 * 404s on a static host.
 *
 * Pnina gets the unprefixed links for free, because next-intl hides the default
 * locale. There is no next-intl here, so it is done explicitly.
 *
 * ── IT REFUSES TO SILENTLY DROP A REAL LOCALE ──
 * The whole scheme only holds while there is exactly one locale. If a second is
 * ever enabled, the flatten step is wrong and so is this, and the failure would
 * otherwise be two locales quietly resolving to the same URLs. So it throws at
 * build time instead, which is the only moment anyone can act on it.
 */
export function localeHref(withinLocale = "/"): string {
  if (generatedSiteConfig.locales.length > 1) {
    throw new Error(
      "localeHref assumes a single-locale site served from the root. " +
        "Enabling a second locale means dropping scripts/flatten-locale-export.mjs " +
        "and restoring the /<locale> prefix in links, metadata and the sitemap.",
    );
  }

  const path = withinLocale.startsWith("/") ? withinLocale : `/${withinLocale}`;
  return siteUrl(path);
}

/**
 * The canonical path of the home page, for metadata and the sitemap.
 *
 * Kept separate from `localeHref` because `next-sitemap`-shaped consumers want
 * a path rather than a resolved href, and because the trailing slash matters
 * here: a canonical of `/` and a canonical of `` are not the same string to a
 * search engine, and `resolveSiteUrl` would join the latter wrongly.
 */
export function localeRootPath(): string {
  return "/";
}
