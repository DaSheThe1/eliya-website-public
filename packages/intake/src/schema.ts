import { z } from "zod";

export const INTAKE_CONTRACT_VERSION = "1.0" as const;
export const INTAKE_FIELD_IDS = [
  "serviceId",
  "name",
  "phone",
  "email",
  "message",
  "timeWindow",
] as const;
export type IntakeFieldId = (typeof INTAKE_FIELD_IDS)[number];
export type IntakeFieldContract = Partial<Record<IntakeFieldId, boolean>>;

export const INTAKE_FIELD_LIMITS = {
  email: 254,
  locale: 16,
  message: 2_000,
  name: 100,
  pagePath: 512,
  phone: 32,
  serviceId: 80,
  timeWindow: 200,
  website: 200,
} as const;

const optionalBoundedText = (maximum: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().min(1).max(maximum).optional(),
  );

const optionalEmail = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .trim()
    .max(INTAKE_FIELD_LIMITS.email)
    .pipe(z.email({ error: "Invalid email" }))
    .optional(),
);

const commonFields = {
  contractVersion: z.literal(INTAKE_CONTRACT_VERSION),
  name: optionalBoundedText(INTAKE_FIELD_LIMITS.name),
  phone: optionalBoundedText(INTAKE_FIELD_LIMITS.phone),
  email: optionalEmail,
  message: optionalBoundedText(INTAKE_FIELD_LIMITS.message),
  serviceId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .trim()
      .min(1)
      .max(INTAKE_FIELD_LIMITS.serviceId)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  ),
  timeWindow: optionalBoundedText(INTAKE_FIELD_LIMITS.timeWindow),
  website: z.string().trim().max(INTAKE_FIELD_LIMITS.website),
  locale: z
    .string()
    .trim()
    .max(INTAKE_FIELD_LIMITS.locale)
    .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  pagePath: z
    .string()
    .trim()
    .max(INTAKE_FIELD_LIMITS.pagePath)
    .regex(/^\/(?:[^\s?#]*)?$/),
};

export const IntakeSubmissionSchema = z.discriminatedUnion("type", [
  z.object({ ...commonFields, type: z.literal("lead") }).strict(),
  z.object({ ...commonFields, type: z.literal("booking") }).strict(),
]);

function fieldIsPresent(value: unknown): boolean {
  return value !== undefined;
}

export function safeParseConfiguredIntakeSubmission(
  input: unknown,
  fields: IntakeFieldContract,
  expectedType: SubmissionType,
) {
  const parsed = IntakeSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  const issues: z.core.$ZodIssue[] = [];
  if (parsed.data.type !== expectedType) {
    issues.push({
      code: "custom",
      input: parsed.data.type,
      message: "Submission type does not match the reviewed intake mode",
      path: ["type"],
    });
  }
  for (const field of INTAKE_FIELD_IDS) {
    const selected = Object.prototype.hasOwnProperty.call(fields, field);
    const required = fields[field] === true;
    const present = fieldIsPresent(parsed.data[field]);
    if (!selected && present) {
      issues.push({
        code: "custom",
        input: parsed.data[field],
        message: "Field is not enabled by the intake contract",
        path: [field],
      });
    } else if (required && !present) {
      issues.push({
        code: "custom",
        input: parsed.data[field],
        message: "Field is required by the intake contract",
        path: [field],
      });
    }
  }
  if (issues.length > 0) {
    return {
      success: false as const,
      error: new z.ZodError(issues),
    };
  }

  const configured: Record<string, unknown> = {
    contractVersion: parsed.data.contractVersion,
    type: parsed.data.type,
    website: parsed.data.website,
    locale: parsed.data.locale,
    pagePath: parsed.data.pagePath,
  };
  for (const field of INTAKE_FIELD_IDS) {
    const value = parsed.data[field];
    if (
      Object.prototype.hasOwnProperty.call(fields, field) &&
      value !== undefined
    ) {
      configured[field] = value;
    }
  }
  return {
    success: true as const,
    data: configured as IntakeSubmission,
  };
}

export const parseIntakeSubmission = (
  input: unknown,
  fields: IntakeFieldContract,
  expectedType: SubmissionType,
) => {
  const parsed = safeParseConfiguredIntakeSubmission(
    input,
    fields,
    expectedType,
  );
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
};

export type IntakeSubmission = z.infer<typeof IntakeSubmissionSchema>;
export type SubmissionType = IntakeSubmission["type"];
export type ForwardableIntakeSubmission = Omit<IntakeSubmission, "website">;
