# Edge Worker contract

Freeze this contract before frontend and Worker tasks begin.

## Routing

- List each Worker-owned method and path explicitly.
- A route match must not swallow static pages, assets, locale paths, or the
  static host's error pages.
- Define CORS from an allowlist of exact origins. Never reflect arbitrary
  origins and never use `*` with credentials.

## Intake boundary

- Accept only the documented method. JSON clients use exactly
  `application/json` (with valid parameters); the no-JavaScript browser
  fallback uses `application/x-www-form-urlencoded`.
- Bound request bytes before parsing, validate the frozen schema, reject unknown
  fields, and normalize only documented fields.
- Derive the single accepted submission discriminator from
  `foundation/runtime-contract.json`: lead intake accepts only `lead`, booking
  intake accepts only `booking`, and the opposite discriminator is rejected
  before delivery. Use the shared configured-intake parser and run both
  opposite-direction fixtures in the Worker parity suite.
- Enforce origin checks, a honeypot, rate limits, deduplication/idempotency, and
  a short upstream timeout.
- Keep upstream URLs and credentials in provider secrets.
- Log request IDs and outcome classes, never contact details or message bodies.
- Return the shared versioned response envelope for success, validation,
  duplicate, rate-limited, not-configured, and upstream-failure states.
- For the browser fallback, normalize the same bounded fields through the same
  schema, then return `303 See Other` to the submitted locale with
  `#contact-result-success` or `#contact-result-error`. Never put submitted
  fields in the redirect URL.

## Release

- Validate against hermetic fixtures with no real webhook.
- Package the Worker separately from static output.
- Record the Worker artifact commit and static artifact commit independently.
- For lead or booking intake, commit a schema-valid
  `foundation/static-worker-receipt.json` only after the real provider route,
  artifact provenance, controls, parity suite, and fictional synthetic request
  have been checked. This is an untrusted operator evidence record, not a
  provider attestation. Generic release validation remains blocked even when
  the record is present. The selected provider integration must implement an
  authentic verifier that binds route ownership and deployed Worker identity to
  exact packaged provenance before release can pass.
- Deployment requires explicit approval and a post-deploy synthetic request
  that contains fictional data only.
