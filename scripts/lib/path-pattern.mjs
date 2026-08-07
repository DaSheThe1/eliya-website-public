function normalize(value) {
  return value.replaceAll("\\", "/").replace(/^\.?\//, "").replace(/\/+$/, "");
}

export function patternPrefix(pattern) {
  const normalized = normalize(pattern);
  const wildcardIndex = normalized.search(/[*?]/);
  return wildcardIndex === -1
    ? normalized
    : normalized.slice(0, wildcardIndex).replace(/\/+$/, "");
}

export function matchesPattern(file, pattern) {
  const normalizedFile = normalize(file);
  const normalizedPattern = normalize(pattern);

  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
  }

  if (!normalizedPattern.includes("*")) {
    return normalizedFile === normalizedPattern;
  }

  const expression = normalizedPattern
    .split("**")
    .map((part) =>
      part
        .split("*")
        .map((literal) => literal.replace(/[.+^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*"),
    )
    .join(".*");

  return new RegExp(`^${expression}$`).test(normalizedFile);
}

export function patternsMayOverlap(left, right) {
  const leftPrefix = patternPrefix(left);
  const rightPrefix = patternPrefix(right);
  return (
    leftPrefix === rightPrefix ||
    leftPrefix.startsWith(`${rightPrefix}/`) ||
    rightPrefix.startsWith(`${leftPrefix}/`)
  );
}
