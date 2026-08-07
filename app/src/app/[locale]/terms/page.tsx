import { notFound } from "next/navigation";

import { LegalPage } from "@/components/sections/legal-page";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { getSiteContent, isLocale } from "@/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const content = getSiteContent(locale);

  return (
    <>
      <SiteHeader content={content} />
      <LegalPage content={content} page="terms" />
      <SiteFooter content={content} />
    </>
  );
}
