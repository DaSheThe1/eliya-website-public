import assert from "node:assert/strict";
import test from "node:test";

import {
  MemoryDuplicateStore,
  MemoryRateLimiter,
  classifyIntakeRequestMediaType,
  createIntakeHandler,
  createWebhookDelivery,
  redactDiagnostic,
  safeParseConfiguredIntakeSubmission,
} from "./index";
import type { ForwardableIntakeSubmission } from "./schema";

const defaultIntakeFields = {
  name: true,
  phone: false,
  email: false,
  message: true,
} as const;

const body = {
  contractVersion: "1.0",
  type: "lead",
  name: "  Example Person  ",
  phone: "  +1 555 0100 ",
  email: "",
  message: "  Please contact me. ",
  website: "",
  locale: "en",
  pagePath: "/",
} as const;

function request(
  input: unknown = body,
  init: { origin?: string; contentType?: string } = {},
) {
  return new Request("https://site.example/api/contact", {
    method: "POST",
    headers: {
      "content-type": init.contentType ?? "application/json",
      origin: init.origin ?? "https://site.example",
    },
    body: JSON.stringify(input),
  });
}

function handler(
  delivery: (submission: ForwardableIntakeSubmission) => Promise<void>,
  overrides: Partial<Parameters<typeof createIntakeHandler>[0]> = {},
) {
  return createIntakeHandler({
    allowedOrigins: ["https://site.example"],
    duplicateSecret: "test-duplicate-secret-at-least-16",
    delivery,
    expectedType: "lead",
    intakeFields: defaultIntakeFields,
    requestIdFactory: () => "request-1",
    now: () => 1_700_000_000_000,
    ...overrides,
  });
}

test("normalizes and forwards only validated fields", async () => {
  let delivered: ForwardableIntakeSubmission | undefined;
  const response = await handler(async (submission) => {
    delivered = submission;
  })(request());

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    status: "accepted",
    message: "Request received.",
    requestId: "request-1",
  });
  assert.deepEqual(delivered, {
    contractVersion: "1.0",
    type: "lead",
    name: "Example Person",
    phone: "+1 555 0100",
    message: "Please contact me.",
    locale: "en",
    pagePath: "/",
  });
  assert.equal("website" in (delivered ?? {}), false);
});

test("rejects the opposite reviewed submission discriminator before delivery", async () => {
  let deliveries = 0;
  const lead = handler(async () => {
    deliveries += 1;
  });
  const rejectedBooking = await lead(request({ ...body, type: "booking" }));
  assert.equal(rejectedBooking.status, 400);

  const booking = handler(
    async () => {
      deliveries += 1;
    },
    { expectedType: "booking" },
  );
  const rejectedLead = await booking(request(body));
  assert.equal(rejectedLead.status, 400);
  assert.equal(deliveries, 0);
});

test("shared Worker parser enforces the same reviewed discriminator", () => {
  assert.equal(
    safeParseConfiguredIntakeSubmission(
      { ...body, type: "booking" },
      defaultIntakeFields,
      "lead",
    ).success,
    false,
  );
  assert.equal(
    safeParseConfiguredIntakeSubmission(
      body,
      defaultIntakeFields,
      "booking",
    ).success,
    false,
  );
  assert.equal(
    safeParseConfiguredIntakeSubmission(
      { ...body, type: "booking" },
      defaultIntakeFields,
      "booking",
    ).success,
    true,
  );
});

test("enforces a phone-only contract and rejects unapproved fields", async () => {
  let delivered: ForwardableIntakeSubmission | undefined;
  const phoneOnly = handler(
    async (submission) => {
      delivered = submission;
    },
    { intakeFields: { phone: true } },
  );
  const accepted = await phoneOnly(
    request({
      contractVersion: "1.0",
      type: "lead",
      phone: " +972 50 000 0000 ",
      website: "",
      locale: "he",
      pagePath: "/he",
    }),
  );
  assert.equal(accepted.status, 202);
  assert.deepEqual(delivered, {
    contractVersion: "1.0",
    type: "lead",
    phone: "+972 50 000 0000",
    locale: "he",
    pagePath: "/he",
  });

  const rejected = await phoneOnly(
    request({
      contractVersion: "1.0",
      type: "lead",
      phone: "+972 50 000 0000",
      email: "unapproved@example.test",
      website: "",
      locale: "he",
      pagePath: "/he",
    }),
  );
  assert.equal(rejected.status, 400);
});

test("enforces required email and booking field contracts", async () => {
  const emailOnly = handler(async () => undefined, {
    intakeFields: { email: true },
  });
  const missingEmail = await emailOnly(
    request({
      contractVersion: "1.0",
      type: "lead",
      website: "",
      locale: "en",
      pagePath: "/en",
    }),
  );
  assert.equal(missingEmail.status, 400);
  const acceptedEmail = await emailOnly(
    request({
      contractVersion: "1.0",
      type: "lead",
      email: "person@example.test",
      website: "",
      locale: "en",
      pagePath: "/en",
    }),
  );
  assert.equal(acceptedEmail.status, 202);

  let bookingSubmission: ForwardableIntakeSubmission | undefined;
  const booking = handler(
    async (submission) => {
      bookingSubmission = submission;
    },
    {
      expectedType: "booking",
      intakeFields: {
        serviceId: true,
        timeWindow: true,
        email: false,
      },
    },
  );
  const acceptedBooking = await booking(
    request({
      contractVersion: "1.0",
      type: "booking",
      serviceId: "consultation",
      timeWindow: "Weekday afternoon",
      website: "",
      locale: "en",
      pagePath: "/en",
    }),
  );
  assert.equal(acceptedBooking.status, 202);
  assert.deepEqual(bookingSubmission, {
    contractVersion: "1.0",
    type: "booking",
    serviceId: "consultation",
    timeWindow: "Weekday afternoon",
    locale: "en",
    pagePath: "/en",
  });
});

test("rejects untrusted origins before delivery", async () => {
  let deliveries = 0;
  const response = await handler(async () => {
    deliveries += 1;
  })(request(body, { origin: "https://attacker.example" }));

  assert.equal(response.status, 403);
  assert.equal(deliveries, 0);
});

test("returns success for a populated honeypot without forwarding", async () => {
  let deliveries = 0;
  const response = await handler(async () => {
    deliveries += 1;
  })(request({ ...body, website: "spam.example" }));

  assert.equal(response.status, 202);
  assert.equal(deliveries, 0);
});

test("rejects oversized and malformed JSON bodies generically", async () => {
  const intake = handler(async () => undefined, { maximumBodyBytes: 1_024 });
  const oversized = await intake(
    request({ ...body, message: "x".repeat(2_000) }),
  );
  assert.equal(oversized.status, 413);

  const malformed = await intake(
    new Request("https://site.example/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://site.example",
      },
      body: "{",
    }),
  );
  assert.equal(malformed.status, 400);
  const payload = (await malformed.json()) as Record<string, unknown>;
  assert.deepEqual(Object.keys(payload).sort(), [
    "message",
    "requestId",
    "status",
  ]);
});

test("accepts application/json with valid media-type parameters", async () => {
  const intake = handler(async () => undefined);
  for (const contentType of [
    "application/json",
    "Application/JSON",
    "application/json;charset=utf-8",
    'application/json; charset="utf-8"; profile="contact-v1"',
    ' application/json ;charset="escaped\\ value" ',
  ]) {
    const response = await intake(request(body, { contentType }));
    assert.equal(response.status, 202, contentType);
  }
});

test("classifies malformed JSON before an unavailable handler is selected", () => {
  assert.equal(
    classifyIntakeRequestMediaType("application/json; charset=utf-8"),
    "json",
  );
  assert.equal(
    classifyIntakeRequestMediaType("application/x-www-form-urlencoded"),
    "form",
  );
  for (const contentType of [
    null,
    "application/json;",
    "application/jsonp",
    "application/json; charset",
    'application/json; charset="unterminated',
    "text/plain",
  ]) {
    assert.equal(
      classifyIntakeRequestMediaType(contentType),
      "unsupported",
      String(contentType),
    );
  }
});

test("rejects JSON prefix collisions and malformed media-type parameters", async () => {
  const intake = handler(async () => undefined);
  for (const contentType of [
    "application/jsonp",
    "application/json-patch+json",
    "application/json; charset",
    "application/json;",
    "application/json; =utf-8",
    'application/json; charset="unterminated',
    "text/application/json",
  ]) {
    const response = await intake(request(body, { contentType }));
    assert.equal(response.status, 400, contentType);
  }
});

test("rate limits before delivery and provides a bounded retry value", async () => {
  let deliveries = 0;
  const intake = handler(
    async () => {
      deliveries += 1;
    },
    {
      rateLimiter: new MemoryRateLimiter(1, 60_000, 10),
      resolveClientKey: () => "client",
    },
  );

  assert.equal((await intake(request())).status, 202);
  const limited = await intake(request());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "60");
  assert.equal(deliveries, 1);
});

test("suppresses duplicate delivery without revealing it to the submitter", async () => {
  let deliveries = 0;
  const intake = handler(
    async () => {
      deliveries += 1;
    },
    { duplicateStore: new MemoryDuplicateStore(60_000, 10) },
  );

  const first = await intake(request());
  const duplicate = await intake(request());
  assert.deepEqual(await first.json(), await duplicate.json());
  assert.equal(deliveries, 1);
});

test("releases a duplicate reservation after failed delivery", async () => {
  let attempts = 0;
  const intake = handler(
    async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("downstream unavailable");
      }
    },
    { duplicateStore: new MemoryDuplicateStore(60_000, 10) },
  );

  assert.equal((await intake(request())).status, 503);
  assert.equal((await intake(request())).status, 202);
  assert.equal(attempts, 2);
});

test("webhook adapter signs a bounded payload and does not follow redirects", async () => {
  let captured: { input: URL | RequestInfo; init?: RequestInit } | undefined;
  const delivery = createWebhookDelivery({
    url: "https://automation.example/hooks/intake",
    signingSecret: "test-signing-secret-at-least-16",
    fetchImplementation: async (input, init) => {
      captured = { input, init };
      return new Response(null, { status: 204 });
    },
  });

  const { website: _website, ...submission } = body;
  await delivery(
    { ...submission, name: submission.name.trim(), phone: submission.phone.trim() },
    { requestId: "request-1", receivedAt: "2026-08-01T00:00:00.000Z" },
  );
  assert.equal(captured?.init?.redirect, "error");
  assert.match(
    new Headers(captured?.init?.headers).get("x-foundation-signature") ?? "",
    /^sha256=[a-f0-9]{64}$/,
  );
});

test("diagnostic redaction removes nested PII and secret values", () => {
  assert.deepEqual(
    redactDiagnostic({
      outcome: "delivery_failed",
      email: "person@example.test",
      nested: { signingSecret: "hidden", count: 1 },
    }),
    {
      outcome: "delivery_failed",
      email: "[redacted]",
      nested: { signingSecret: "[redacted]", count: 1 },
    },
  );
});
