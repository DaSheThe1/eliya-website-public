import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  SITE_MOTION_BOOT_SCRIPT,
  SkipLink,
} from "@foundation/accessibility";
import "@foundation/design-tokens/tokens.css";
import { buildMetadata } from "@foundation/seo";

import {
  generatedLocalePath,
  generatedSiteConfig,
  isFixtureContent,
} from "@/config/generated-site";
import { enabledLocales, getSiteContent, isLocale, type Locale } from "@/content";

import "../globals.css";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams(): Array<{ locale: Locale }> {
  return enabledLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const content = getSiteContent(locale);
  const indexable = generatedSiteConfig.indexable && !isFixtureContent;
  return buildMetadata({
    siteName: generatedSiteConfig.identityName,
    siteUrl: generatedSiteConfig.siteUrl,
    basePath: generatedSiteConfig.basePath,
    path: generatedLocalePath(locale),
    title: content.meta.title,
    description: content.meta.description,
    locale,
    indexable,
  });
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const content = getSiteContent(locale);
  const motionEnabled = generatedSiteConfig.motion !== "none";

  return (
    <html
      data-site-motion={motionEnabled ? "motion" : "reduced"}
      dir={content.direction}
      lang={content.locale}
      suppressHydrationWarning
    >
      {motionEnabled ? (
        <head>
          <script
            dangerouslySetInnerHTML={{ __html: SITE_MOTION_BOOT_SCRIPT }}
          />
        </head>
      ) : null}
      <body>
        <SkipLink targetId="main-content">{content.skipLabel}</SkipLink>
        {/* The living background. Decorative and inert: two slowly drifting
            light sources plus a fine grain, on a fixed composited layer behind
            every section. Under the stored motion opt-out the drift stops and
            the lights simply sit still. */}
        <div aria-hidden className="site-glow">
          <span className="site-glow__orb site-glow__orb--gold" />
          <span className="site-glow__orb site-glow__orb--sea" />
          <span className="site-glow__grain" />
        </div>
        {children}
      </body>
    </html>
  );
}
