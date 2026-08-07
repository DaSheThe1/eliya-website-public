import {
  createAnalyticsClient,
  createConsentGatedAnalytics,
  createCookielessAnalytics,
  isAnalyticsEvent,
  providerRequiresConsent,
} from "./analytics";

async function test(_name: string, implementation: () => Promise<void>) {
  await implementation();
}

function equal(actual: unknown, expected: unknown) {
  if (!Object.is(actual, expected)) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

await test("does not dispatch without affirmative consent", async () => {
  let dispatches = 0;
  const client = createConsentGatedAnalytics({
    getConsent: () => "unknown",
    adapter: () => {
      dispatches += 1;
    },
  });
  const sent = await client.track({
    name: "cta_click",
    properties: { ctaId: "hero-contact", placement: "hero" },
  });
  equal(sent, false);
  equal(dispatches, 0);
});

await test("dispatches only allowlisted, non-PII event fields after consent", async () => {
  let dispatches = 0;
  const client = createConsentGatedAnalytics({
    getConsent: () => "granted",
    adapter: () => {
      dispatches += 1;
    },
  });
  equal(
    await client.track({
      name: "form_submit",
      properties: { formType: "lead", outcome: "accepted" },
    }),
    true,
  );
  equal(dispatches, 1);
  equal(
    isAnalyticsEvent({
      name: "form_submit",
      properties: {
        formType: "lead",
        outcome: "accepted",
        email: "person@example.test",
      },
    }),
    false,
  );
});

await test("dispatches cookieless events with no consent source", async () => {
  let dispatches = 0;
  const client = createCookielessAnalytics({
    adapter: () => {
      dispatches += 1;
    },
  });
  equal(
    await client.track({
      name: "cta_click",
      properties: { ctaId: "hero-contact", placement: "hero" },
    }),
    true,
  );
  equal(dispatches, 1);
});

await test("cookieless lane still rejects events carrying PII", async () => {
  let dispatches = 0;
  const client = createCookielessAnalytics({
    adapter: () => {
      dispatches += 1;
    },
  });
  equal(
    await client.track({
      name: "form_submit",
      properties: {
        formType: "lead",
        outcome: "accepted",
        email: "person@example.test",
      },
    } as never),
    false,
  );
  equal(dispatches, 0);
});

await test("classifies identifying and cookieless providers", async () => {
  equal(providerRequiresConsent("google-analytics"), true);
  equal(providerRequiresConsent("umami"), false);
});

await test("umami runs un-gated through the configured client", async () => {
  let dispatches = 0;
  const client = createAnalyticsClient({
    provider: "umami",
    consentRequired: false,
    adapter: () => {
      dispatches += 1;
    },
  });
  equal(
    await client.track({
      name: "navigation",
      properties: { destinationId: "pricing" },
    }),
    true,
  );
  equal(dispatches, 1);
});

await test("refuses an identifying provider declared without consent", async () => {
  let constructed = false;
  try {
    createAnalyticsClient({
      provider: "google-analytics",
      consentRequired: false,
      adapter: () => {},
    });
    constructed = true;
  } catch {
    // Expected: this combination would make the cookieless lane a bypass path.
  }
  equal(constructed, false);
});

await test("refuses a consent-gated client with no consent source", async () => {
  let constructed = false;
  try {
    createAnalyticsClient({
      provider: "google-analytics",
      consentRequired: true,
      adapter: () => {},
    });
    constructed = true;
  } catch {
    // Expected: a gate with nothing to read is not a gate.
  }
  equal(constructed, false);
});

await test("configured consent-gated client still withholds until granted", async () => {
  let dispatches = 0;
  let consent: "unknown" | "granted" = "unknown";
  const client = createAnalyticsClient({
    provider: "google-analytics",
    consentRequired: true,
    getConsent: () => consent,
    adapter: () => {
      dispatches += 1;
    },
  });
  const event = {
    name: "cta_click",
    properties: { ctaId: "hero-contact", placement: "hero" },
  } as const;

  equal(await client.track(event), false);
  equal(dispatches, 0);

  consent = "granted";
  equal(await client.track(event), true);
  equal(dispatches, 1);
});
