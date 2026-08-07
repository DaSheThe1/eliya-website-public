export const ANALYTICS_CONSENT_KEY = "foundation.analytics-consent.v1";

export type AnalyticsConsent = "unknown" | "granted" | "denied";

export interface AnalyticsEventMap {
  cta_click: {
    ctaId: string;
    placement: string;
  };
  form_start: {
    formType: "lead" | "booking";
  };
  form_submit: {
    formType: "lead" | "booking";
    outcome: "accepted" | "invalid" | "rate_limited" | "unavailable";
  };
  navigation: {
    destinationId: string;
  };
}

export type AnalyticsEvent = {
  [Name in keyof AnalyticsEventMap]: {
    name: Name;
    properties: AnalyticsEventMap[Name];
  };
}[keyof AnalyticsEventMap];

export type ConsentProvider = () =>
  | AnalyticsConsent
  | Promise<AnalyticsConsent>;

export type AnalyticsAdapter = (event: AnalyticsEvent) => void | Promise<void>;

export type AnalyticsDiagnostic = Readonly<{
  event: "analytics_dispatch";
  outcome: "sent" | "consent_missing" | "invalid_event" | "adapter_failed";
  eventName?: keyof AnalyticsEventMap;
}>;

export interface AnalyticsClient {
  track(event: AnalyticsEvent): Promise<boolean>;
}

export type DiagnosticReporter = (value: AnalyticsDiagnostic) => void;

export interface ConsentGatedAnalyticsOptions {
  getConsent: ConsentProvider;
  adapter: AnalyticsAdapter;
  diagnostic?: DiagnosticReporter;
}

export type AnalyticsProvider =
  | "none"
  | "google-analytics"
  | "umami"
  | "custom";

/**
 * Providers that set cookies or other identifying client storage. They may
 * never dispatch before affirmative consent, so a cookieless lane must never
 * become a bypass path that loads them.
 */
const identifyingProviders: ReadonlySet<AnalyticsProvider> = new Set([
  "google-analytics",
]);

export function providerRequiresConsent(provider: AnalyticsProvider): boolean {
  return identifyingProviders.has(provider);
}

/**
 * A cookieless provider sets no identifiers, so its events carry no personal
 * data and dispatch without a consent gate. Event validation, PII rejection,
 * and failure isolation are identical to the consent-gated lane.
 */
export interface CookielessAnalyticsOptions {
  adapter: AnalyticsAdapter;
  diagnostic?: DiagnosticReporter;
}

export interface AnalyticsClientOptions {
  provider: AnalyticsProvider;
  consentRequired: boolean;
  adapter: AnalyticsAdapter;
  getConsent?: ConsentProvider;
  diagnostic?: DiagnosticReporter;
}

const identifierPattern = /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/;

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 100 &&
    identifierPattern.test(value)
  );
}

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as { name?: unknown; properties?: unknown };
  if (!event.properties || typeof event.properties !== "object") {
    return false;
  }
  const properties = event.properties as Record<string, unknown>;

  switch (event.name) {
    case "cta_click":
      return (
        Object.keys(properties).length === 2 &&
        validIdentifier(properties.ctaId) &&
        validIdentifier(properties.placement)
      );
    case "form_start":
      return (
        Object.keys(properties).length === 1 &&
        ["lead", "booking"].includes(String(properties.formType))
      );
    case "form_submit":
      return (
        Object.keys(properties).length === 2 &&
        ["lead", "booking"].includes(String(properties.formType)) &&
        ["accepted", "invalid", "rate_limited", "unavailable"].includes(
          String(properties.outcome),
        )
      );
    case "navigation":
      return (
        Object.keys(properties).length === 1 &&
        validIdentifier(properties.destinationId)
      );
    default:
      return false;
  }
}

function safeDiagnostic(
  reporter: DiagnosticReporter | undefined,
  value: AnalyticsDiagnostic,
) {
  try {
    reporter?.(value);
  } catch {
    // Analytics diagnostics must not affect the application.
  }
}

/**
 * Shared dispatch path for both lanes. `getConsent` is omitted only for a
 * cookieless provider; every other guarantee — event allowlisting, structural
 * revalidation of the cloned event, and adapter failure isolation — is
 * identical whether or not a consent gate applies.
 */
async function dispatch(
  event: AnalyticsEvent,
  adapter: AnalyticsAdapter,
  diagnostic: DiagnosticReporter | undefined,
  getConsent?: ConsentProvider,
): Promise<boolean> {
  if (!isAnalyticsEvent(event)) {
    safeDiagnostic(diagnostic, {
      event: "analytics_dispatch",
      outcome: "invalid_event",
    });
    return false;
  }

  const safeEvent = JSON.parse(JSON.stringify(event)) as AnalyticsEvent;

  if (getConsent && (await getConsent()) !== "granted") {
    safeDiagnostic(diagnostic, {
      event: "analytics_dispatch",
      outcome: "consent_missing",
      eventName: event.name,
    });
    return false;
  }

  try {
    if (!isAnalyticsEvent(safeEvent)) {
      safeDiagnostic(diagnostic, {
        event: "analytics_dispatch",
        outcome: "invalid_event",
      });
      return false;
    }
    await adapter(safeEvent);
    safeDiagnostic(diagnostic, {
      event: "analytics_dispatch",
      outcome: "sent",
      eventName: event.name,
    });
    return true;
  } catch {
    safeDiagnostic(diagnostic, {
      event: "analytics_dispatch",
      outcome: "adapter_failed",
      eventName: event.name,
    });
    return false;
  }
}

export function createConsentGatedAnalytics(
  options: ConsentGatedAnalyticsOptions,
): AnalyticsClient {
  return {
    track: (event) =>
      dispatch(event, options.adapter, options.diagnostic, options.getConsent),
  };
}

/**
 * Dispatches without a consent gate. Valid only for a provider that sets no
 * cookies or other identifiers; `createAnalyticsClient` enforces that.
 */
export function createCookielessAnalytics(
  options: CookielessAnalyticsOptions,
): AnalyticsClient {
  return {
    track: (event) => dispatch(event, options.adapter, options.diagnostic),
  };
}

/**
 * Selects the lane from the site's declared analytics configuration and
 * refuses the combinations that would break the privacy contract: an
 * identifying provider running un-gated, or a consent-gated provider with no
 * consent source to read.
 */
export function createAnalyticsClient(
  options: AnalyticsClientOptions,
): AnalyticsClient {
  const { provider, consentRequired, adapter, getConsent, diagnostic } =
    options;

  if (providerRequiresConsent(provider) && !consentRequired) {
    throw new Error(
      `Analytics provider "${provider}" sets identifiers and must not dispatch without consent.`,
    );
  }

  if (consentRequired) {
    if (!getConsent) {
      throw new Error(
        "Consent-gated analytics requires a getConsent provider.",
      );
    }
    return createConsentGatedAnalytics({ getConsent, adapter, diagnostic });
  }

  return createCookielessAnalytics({ adapter, diagnostic });
}
