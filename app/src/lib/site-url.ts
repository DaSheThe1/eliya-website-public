import { siteConfig } from "@/config/site";

const absoluteUrlPattern = /^[a-z][a-z\d+.-]*:/i;

/**
 * Resolves links owned by this site against its configured deployment base
 * path. Hash links remain page-relative, while external and protocol-relative
 * URLs pass through unchanged.
 */
export function withBasePath(path: string, basePath: string): string {
  if (
    path.startsWith("#") ||
    path.startsWith("//") ||
    absoluteUrlPattern.test(path)
  ) {
    return path;
  }

  const absolutePath = path.startsWith("/") ? path : `/${path}`;
  if (
    !basePath ||
    absolutePath === basePath ||
    absolutePath.startsWith(`${basePath}/`)
  ) {
    return absolutePath;
  }

  return `${basePath}${absolutePath}`;
}

export function siteUrl(path: string): string {
  return withBasePath(path, siteConfig.basePath);
}
