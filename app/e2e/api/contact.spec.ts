import { expect, test } from "@playwright/test";

import {
  hasIntakeField,
  hasIntakeModule,
  hasServerApi,
  pagePath,
  referenceOrigin,
  testSite,
} from "../site-fixture";

const contactEndpoint = `${testSite.basePath}/api/contact`;
const contactApiAvailable = hasIntakeModule && hasServerApi;
const configuredValues = {
  serviceId: "general",
  name: "Example",
  phone: "+972 50 000 0000",
  email: "example@example.test",
  message: "Example message",
  timeWindow: "Weekday afternoon",
} as const;

function configuredSubmission() {
  return {
    contractVersion: "1.0",
    type: testSite.intakeMode === "booking" ? "booking" : "lead",
    website: "",
    locale: testSite.defaultLocale,
    pagePath: pagePath(testSite.defaultLocale),
    ...Object.fromEntries(
      Object.entries(configuredValues).filter(([field]) =>
        hasIntakeField(field as keyof typeof configuredValues),
      ),
    ),
  };
}

function oppositeSubmissionType() {
  return testSite.intakeMode === "booking" ? "lead" : "booking";
}

test.beforeEach(() => {
  test.skip(
    !contactApiAvailable,
    "The selected modules/profile do not expose the Next contact adapter.",
  );
});

test("an unavailable destination returns a stable, generic response", async ({
  request,
}) => {
  const response = await request.post(contactEndpoint, {
    headers: { origin: referenceOrigin },
    data: configuredSubmission(),
  });
  expect(response.status()).toBe(503);
  const body = await response.json();
  expect(body).toEqual({
    status: "temporarily_unavailable",
    message: "The service is temporarily unavailable.",
    requestId: expect.any(String),
  });
  expect(JSON.stringify(body)).not.toContain("webhook");
});

test("the API rejects a discriminator outside the reviewed intake mode", async ({
  request,
}) => {
  const response = await request.post(contactEndpoint, {
    headers: { origin: referenceOrigin },
    data: {
      ...configuredSubmission(),
      type: oppositeSubmissionType(),
    },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({
    status: "invalid_request",
    message: "The request could not be processed.",
  });
});

test("unsupported contact methods return the stable invalid status", async ({
  request,
}) => {
  const response = await request.get(contactEndpoint);
  expect(response.status()).toBe(405);
  expect(await response.json()).toEqual({
    status: "invalid_request",
    message: "The request could not be processed.",
    requestId: expect.any(String),
  });
});

test("browser form POST redirects without reflecting submitted data", async ({
  request,
}) => {
  const response = await request.post(contactEndpoint, {
    form: configuredSubmission(),
    headers: { origin: referenceOrigin },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  const location = response.headers().location;
  expect(location).toBeTruthy();
  const redirect = new URL(location ?? referenceOrigin);
  expect(redirect.pathname).toBe(pagePath(testSite.defaultLocale));
  expect(redirect.hash).toBe("#contact-result-error");
  expect(location).not.toContain("Private");
  expect(location).not.toContain("private%40example");
  expect(location).not.toContain("?");
});

test("unsupported contact media types fail generically", async ({ request }) => {
  const response = await request.post(contactEndpoint, {
    data: "not-json",
    headers: {
      "content-type": "text/plain",
      origin: referenceOrigin,
    },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({
    status: "invalid_request",
    message: "The request could not be processed.",
  });
});
