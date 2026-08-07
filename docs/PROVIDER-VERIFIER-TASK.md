# Provider verifier implementation task

Release remains blocked until this repository has an authenticated verifier
for the selected GitHub and Cloudflare resources. Operator-entered receipts,
hashes, booleans, screenshots, and successful workflow output are evidence but
are never authority.

## Frozen candidate

- GitHub Pages origin: `https://eliya.trickticmedia.com`
- Static base path: ``
- Worker route: `https://eliya.trickticmedia.com/api/contact`
- Cloudflare Worker name: `eliya-thebeautybrand-intake`
- Intake destination: `n8n`
- Intake contract: `lead` version `1.0`

## Backend/platform task

1. Add explicit, approved GitHub repository/environment and Cloudflare
   account/zone/script identifiers to the deployment decision. Record secret
   names only; keep tokens in provider credential stores.
2. Implement a read-only verifier that authenticates to GitHub and Cloudflare
   APIs. Missing credentials, authorization failures, API errors, pending
   deployments, or incomplete responses must block.
3. For GitHub Pages, require the successful protected-environment deployment
   and authenticated workflow run for the exact public branch/tag ref, exact
   public commit, and exact Pages artifact ID. Prove that the workflow run's
   head commit equals the manifest commit. Download that provider artifact
   through the authenticated API
   and run the exhaustive artifact verifier over every declared byte, binding
   it to the exact private source commit. A public HTTP marker fetch is
   supplemental evidence only.
4. For Cloudflare, require one active Worker version at 100%, the exact
   approved script/version identity, the exact route ownership above, no
   workers.dev/preview or other unapproved endpoint, required secret/binding
   names without values, and a deployed bundle identity bound to the exact
   packaged Worker provenance.
5. Validate `foundation/paired-provider-release.json`, bind both provider
   results to that one release candidate, and reject unresolved identifiers,
   stale evidence, split traffic, mismatched routes, missing approvals, or
   partially deployed state.
6. Integrate the verifier into `pnpm release:check` so success is possible
   only from fresh authenticated provider responses. Keep
   `foundation/static-worker-receipt.json` untrusted.
7. Add hermetic API fixtures for success plus wrong commit/digest/status,
   tampered Pages content, wrong Worker/version/route, split traffic, absent
   secrets, 401/403/429/5xx, timeout, malformed response, and stale evidence.

Do not run provider calls, publish, deploy, change routes/DNS, or create
credentials as part of the implementation task. A release operator performs
fresh verification only after separately approved deployments.
