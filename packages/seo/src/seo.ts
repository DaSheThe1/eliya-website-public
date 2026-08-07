import type { Metadata } from "next";

export interface PageSeoInput {
  siteName: string;
  siteUrl: string;
  basePath?: string;
  path: string;
  title: string;
  description: string;
  locale: string;
  indexable?: boolean;
  socialImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

function normalizeBasePath(basePath: string): string {
  const value = basePath.trim();
  if (!value || value === "/") {
    return "";
  }
  if (!/^\/[a-zA-Z0-9/_-]*[a-zA-Z0-9_-]$/.test(value)) {
    throw new Error("basePath must be empty or an absolute path without a slash suffix");
  }
  return value;
}

function normalizePagePath(path: string): string {
  const value = path.trim();
  if (!/^\/(?:[^\s?#]*)?$/.test(value)) {
    throw new Error("Page path must be an absolute path without query or fragment");
  }
  return value;
}

export function resolveSiteUrl(
  siteUrl: string,
  basePath = "",
  path = "/",
): URL {
  const origin = new URL(siteUrl);
  if (!["http:", "https:"].includes(origin.protocol)) {
    throw new Error("siteUrl must use HTTP(S)");
  }
  origin.pathname = `${normalizeBasePath(basePath)}${normalizePagePath(path)}`;
  origin.search = "";
  origin.hash = "";
  return origin;
}

export function buildMetadata(input: PageSeoInput): Metadata {
  const canonical = resolveSiteUrl(input.siteUrl, input.basePath, input.path);
  const metadata: Metadata = {
    metadataBase: new URL(input.siteUrl),
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots:
      input.indexable === false
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: input.siteName,
      title: input.title,
      description: input.description,
      locale: input.locale.replace("-", "_"),
      url: canonical,
    },
  };

  if (input.socialImage) {
    const imageUrl = new URL(input.socialImage.src, canonical);
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: imageUrl,
          alt: input.socialImage.alt,
          width: input.socialImage.width,
          height: input.socialImage.height,
        },
      ],
    };
    metadata.twitter = {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
    };
  }

  return metadata;
}

export interface OrganizationJsonLdInput {
  name: string;
  url: string;
  legalName?: string;
  logoUrl?: string;
  sameAs?: readonly string[];
}

export function buildOrganizationJsonLd(input: OrganizationJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.logoUrl ? { logo: input.logoUrl } : {}),
    ...(input.sameAs?.length ? { sameAs: [...input.sameAs] } : {}),
  } as const;
}

export interface WebSiteJsonLdInput {
  name: string;
  url: string;
  locale: string;
}

export function buildWebSiteJsonLd(input: WebSiteJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    inLanguage: input.locale,
  } as const;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
