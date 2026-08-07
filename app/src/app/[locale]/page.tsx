import { notFound } from "next/navigation";

import {
  AccessibilityPanel,
  CookieNotice,
  FloatingWhatsApp,
  SiteFooter,
  SiteHeader,
} from "@/components/layout";
import { CursorSurface } from "@/components/motion/cursor-surface";
import {
  About,
  Contact,
  Faq,
  Hero,
  Method,
  Offer,
  Pain,
  Process,
  Proof,
  Stats,
  Testimonials,
} from "@/components/sections";
import { getSiteContent, isLocale } from "@/content";
import { hasGeneratedModule } from "@/config/generated-site";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Section order. About moved directly under the hero on 2026-08-05: someone who
 * has just watched her talk wants to know who she is before the argument
 * starts, and certainly before the page asks for a phone number.
 */
export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const content = getSiteContent(locale);

  return (
    <>
      {hasGeneratedModule("motion-cursor-surface") ? <CursorSurface /> : null}
      <SiteHeader content={content} />
      <main id="main-content" tabIndex={-1}>
        <Hero content={content} />
        <About content={content} />
        <Pain content={content} />
        <Method content={content} />
        {/*
          The journey sits between the three pillars and the numbers: Method
          says WHAT changes, Process says what actually happens if she leaves
          her details, and Stats then says what it produced for someone else.
        */}
        {hasGeneratedModule("motion-native-scroll-story") ? (
          <Process content={content} />
        ) : null}
        <Stats content={content} />
        {hasGeneratedModule("gallery") ? <Proof content={content} /> : null}
        {hasGeneratedModule("testimonials") ? (
          <Testimonials content={content} />
        ) : null}
        <Offer content={content} />
        <Faq content={content} />
        {hasGeneratedModule("lead-form") ? <Contact content={content} /> : null}
      </main>
      <SiteFooter content={content} />
      <FloatingWhatsApp content={content} />
      <AccessibilityPanel content={content} />
      <CookieNotice content={content} />
    </>
  );
}
