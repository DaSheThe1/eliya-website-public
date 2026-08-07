import { SiteConfigSchema, SiteContentSchema } from "./schemas";

function test(_name: string, implementation: () => void) {
  implementation();
}

function equal(actual: unknown, expected: unknown) {
  if (!Object.is(actual, expected)) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

const config = {
  contractVersion: "1.0",
  identity: { name: "Foundation Preview" },
  locale: "en",
  direction: "ltr",
  siteUrl: "https://example.test",
  basePath: "",
  routes: [{ id: "home", path: "/", label: "Home", indexable: true }],
  seo: {
    title: "Foundation preview",
    description: "A neutral preview used to verify the landing-page foundation.",
  },
} as const;

test("accepts a bounded, client-neutral site configuration", () => {
  const parsed = SiteConfigSchema.parse(config);
  equal(parsed.routes[0]?.path, "/");
});

test("rejects duplicate route paths", () => {
  const result = SiteConfigSchema.safeParse({
    ...config,
    routes: [
      ...config.routes,
      { id: "other", path: "/", label: "Other", indexable: false },
    ],
  });
  equal(result.success, false);
});

test("requires evidence for testimonial copy", () => {
  const result = SiteContentSchema.safeParse({
    contractVersion: "1.0",
    routeId: "home",
    sections: [
      {
        id: "proof",
        type: "testimonials",
        title: "Client feedback",
        items: [{ id: "quote", quote: { value: "Unverified" } }],
      },
    ],
  });
  equal(result.success, false);
});

test("rejects non-decorative media without alternative text", () => {
  const result = SiteContentSchema.safeParse({
    contractVersion: "1.0",
    routeId: "home",
    sections: [
      {
        id: "hero",
        type: "hero",
        title: "A verified title",
        body: "A bounded body.",
        actions: [
          {
            id: "contact",
            label: "Contact",
            kind: "submit-lead",
          },
        ],
        media: {
          src: "/media/hero.webp",
          alt: "",
          width: 1_200,
          height: 800,
          decorative: false,
        },
      },
    ],
  });
  equal(result.success, false);
});

test("rejects executable action URLs", () => {
  const result = SiteContentSchema.safeParse({
    contractVersion: "1.0",
    routeId: "home",
    sections: [
      {
        id: "hero",
        type: "hero",
        title: "A verified title",
        body: "A bounded body.",
        actions: [
          {
            id: "details",
            label: "Details",
            kind: "navigate",
            href: "javascript:alert(1)",
          },
        ],
      },
    ],
  });
  equal(result.success, false);
});
