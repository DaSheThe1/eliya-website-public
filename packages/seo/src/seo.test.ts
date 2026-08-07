import {
  buildMetadata,
  resolveSiteUrl,
  serializeJsonLd,
} from "./seo";

function test(_name: string, implementation: () => void) {
  implementation();
}

function equal(actual: unknown, expected: unknown) {
  if (!Object.is(actual, expected)) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

test("resolves canonical URLs with a base path", () => {
  equal(
    resolveSiteUrl("https://example.test", "/services", "/about").toString(),
    "https://example.test/services/about",
  );
});

test("builds non-indexable metadata without mutating page content", () => {
  const metadata = buildMetadata({
    siteName: "Verified business",
    siteUrl: "https://example.test",
    path: "/private",
    title: "Private",
    description: "A private route.",
    locale: "en",
    indexable: false,
  });
  equal(JSON.stringify(metadata.robots), '{"index":false,"follow":false}');
  equal(metadata.openGraph?.url?.toString(), "https://example.test/private");
});

test("escapes executable HTML characters in JSON-LD", () => {
  equal(
    serializeJsonLd({ value: "</script><script>" }),
    '{"value":"\\u003c/script>\\u003cscript>"}',
  );
});
