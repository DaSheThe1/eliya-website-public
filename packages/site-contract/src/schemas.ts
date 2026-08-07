import { z } from "zod";

const identifier = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isSafeRelativePath(value: string): boolean {
  return /^\/(?!\/)[^\s]*$/.test(value);
}

export const DirectionSchema = z.enum(["ltr", "rtl"]);

export const LocaleSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);

export const ContentSourceSchema = z
  .object({
    kind: z.enum(["client", "document", "repository", "website"]),
    reference: boundedText(500),
    checkedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const SourceBackedTextSchema = z
  .object({
    value: boundedText(2_000),
    source: ContentSourceSchema,
  })
  .strict();

export const ActionSchema = z
  .object({
    id: identifier,
    label: boundedText(100),
    kind: z.enum([
      "submit-lead",
      "submit-booking",
      "call",
      "whatsapp",
      "email",
      "navigate",
      "download",
    ]),
    href: z.string().trim().max(2_048).optional(),
    analyticsId: identifier.optional(),
  })
  .strict()
  .superRefine((action, context) => {
    const requiresHref = !action.kind.startsWith("submit-");
    if (requiresHref && !action.href) {
      context.addIssue({
        code: "custom",
        path: ["href"],
        message: `${action.kind} actions require an href`,
      });
      return;
    }
    if (!action.href) {
      return;
    }

    const safe =
      (action.kind === "call" && /^tel:\+?[0-9(). -]+$/.test(action.href)) ||
      (action.kind === "email" &&
        /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(action.href)) ||
      (action.kind === "whatsapp" &&
        isHttpUrl(action.href) &&
        ["wa.me", "api.whatsapp.com"].includes(new URL(action.href).hostname)) ||
      (["navigate", "download"].includes(action.kind) &&
        (isSafeRelativePath(action.href) || isHttpUrl(action.href)));

    if (!safe) {
      context.addIssue({
        code: "custom",
        path: ["href"],
        message: `Unsafe or incompatible href for ${action.kind} action`,
      });
    }
  });

export const MediaSchema = z
  .object({
    src: z.string().trim().min(1).max(2_048),
    alt: z.string().trim().max(300),
    width: z.number().int().positive().max(10_000),
    height: z.number().int().positive().max(10_000),
    decorative: z.boolean().default(false),
  })
  .strict()
  .superRefine((media, context) => {
    if (!isSafeRelativePath(media.src) && !isHttpUrl(media.src)) {
      context.addIssue({
        code: "custom",
        path: ["src"],
        message: "Media source must be a safe site path or HTTP(S) URL",
      });
    }
    if (!media.decorative && media.alt.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["alt"],
        message: "Non-decorative media requires alternative text",
      });
    }
  });

const sectionBase = {
  id: identifier,
  eyebrow: boundedText(120).optional(),
  title: boundedText(200),
};

const HeroSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("hero"),
    body: boundedText(1_200),
    actions: z.array(ActionSchema).min(1).max(3),
    media: MediaSchema.optional(),
  })
  .strict();

const RichTextSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("rich-text"),
    paragraphs: z.array(boundedText(2_000)).min(1).max(12),
  })
  .strict();

const FeatureSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("features"),
    items: z
      .array(
        z
          .object({
            id: identifier,
            title: boundedText(160),
            body: boundedText(800),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();

const ProcessSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("process"),
    steps: z
      .array(
        z
          .object({
            id: identifier,
            title: boundedText(160),
            body: boundedText(800),
          })
          .strict(),
      )
      .min(2)
      .max(12),
  })
  .strict();

const FaqSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("faq"),
    items: z
      .array(
        z
          .object({
            id: identifier,
            question: boundedText(300),
            answer: boundedText(2_000),
          })
          .strict(),
      )
      .min(1)
      .max(24),
  })
  .strict();

const GallerySectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("gallery"),
    items: z.array(MediaSchema).min(1).max(40),
  })
  .strict();

const ContactSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("contact"),
    body: boundedText(1_200),
    form: z.enum(["lead", "booking", "none"]),
    actions: z.array(ActionSchema).max(3).default([]),
  })
  .strict();

const TestimonialSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("testimonials"),
    items: z
      .array(
        z
          .object({
            id: identifier,
            quote: SourceBackedTextSchema,
            attribution: SourceBackedTextSchema,
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();

export const ContentSectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  RichTextSectionSchema,
  FeatureSectionSchema,
  ProcessSectionSchema,
  FaqSectionSchema,
  GallerySectionSchema,
  ContactSectionSchema,
  TestimonialSectionSchema,
]);

export const RouteSchema = z
  .object({
    id: identifier,
    path: z
      .string()
      .trim()
      .regex(/^\/(?:[a-z0-9][a-z0-9/-]*)?$/),
    label: boundedText(100),
    indexable: z.boolean().default(true),
    sitemapPriority: z.number().min(0).max(1).optional(),
    changeFrequency: z
      .enum([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ])
      .optional(),
  })
  .strict();

export const SiteConfigSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    identity: z
      .object({
        name: boundedText(120),
        legalName: boundedText(160).optional(),
      })
      .strict(),
    locale: LocaleSchema,
    direction: DirectionSchema,
    siteUrl: z.url({ protocol: /^https?$/ }),
    basePath: z
      .string()
      .trim()
      .regex(/^$|^\/[a-zA-Z0-9/_-]*[a-zA-Z0-9_-]$/),
    routes: z.array(RouteSchema).min(1),
    seo: z
      .object({
        title: boundedText(70),
        description: boundedText(180),
        socialImage: MediaSchema.optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((config, context) => {
    const routeIds = new Set<string>();
    const routePaths = new Set<string>();

    for (const [index, route] of config.routes.entries()) {
      if (routeIds.has(route.id)) {
        context.addIssue({
          code: "custom",
          path: ["routes", index, "id"],
          message: "Route IDs must be unique",
        });
      }
      if (routePaths.has(route.path)) {
        context.addIssue({
          code: "custom",
          path: ["routes", index, "path"],
          message: "Route paths must be unique",
        });
      }
      routeIds.add(route.id);
      routePaths.add(route.path);
    }

    if (!routePaths.has("/")) {
      context.addIssue({
        code: "custom",
        path: ["routes"],
        message: "A root route is required",
      });
    }
  });

export const SiteContentSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    routeId: identifier,
    sections: z.array(ContentSectionSchema).min(1).max(40),
  })
  .strict()
  .superRefine((content, context) => {
    const ids = new Set<string>();
    for (const [index, section] of content.sections.entries()) {
      if (ids.has(section.id)) {
        context.addIssue({
          code: "custom",
          path: ["sections", index, "id"],
          message: "Section IDs must be unique within a route",
        });
      }
      ids.add(section.id);
    }
  });

export const parseSiteConfig = (input: unknown) => SiteConfigSchema.parse(input);
export const parseSiteContent = (input: unknown) =>
  SiteContentSchema.parse(input);

export type Direction = z.infer<typeof DirectionSchema>;
export type Locale = z.infer<typeof LocaleSchema>;
export type ContentSource = z.infer<typeof ContentSourceSchema>;
export type SourceBackedText = z.infer<typeof SourceBackedTextSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type ContentSection = z.infer<typeof ContentSectionSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type SiteContent = z.infer<typeof SiteContentSchema>;
