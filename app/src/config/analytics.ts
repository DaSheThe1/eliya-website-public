/**
 * The site's analytics decision, mirroring `integrations.analytics` in the site
 * brief.
 *
 * `consentRequired` is a property of the provider, not a preference. A provider
 * that sets cookies or other identifiers ("google-analytics") must stay gated;
 * a cookieless provider ("umami") sets no identifiers, needs no consent to be
 * lawful, and is therefore loaded independently of the consent component.
 *
 * `createAnalyticsClient` in @foundation/analytics rejects an identifying
 * provider declared with `consentRequired: false`, so a cookieless lane can
 * never become a bypass path that loads a consent-gated tracker.
 *
 * The client-neutral default collects nothing. A generated site sets these two
 * values from its approved brief.
 */
export const analyticsConfig = {
  provider: "none",
  consentRequired: true,
} as const;
