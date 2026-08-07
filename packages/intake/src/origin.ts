function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function normalizeAllowedOrigins(origins: readonly string[]): Set<string> {
  const normalized = new Set<string>();
  for (const origin of origins) {
    const value = normalizeOrigin(origin);
    if (!value) {
      throw new Error("Allowed origins must be absolute HTTP(S) origins");
    }
    normalized.add(value);
  }
  return normalized;
}

export function isAllowedRequestOrigin(
  request: Request,
  allowedOrigins: ReadonlySet<string>,
  allowMissingOrigin: boolean,
): boolean {
  const header = request.headers.get("origin");
  if (!header) {
    return allowMissingOrigin;
  }
  const normalized = normalizeOrigin(header);
  return normalized !== null && allowedOrigins.has(normalized);
}
