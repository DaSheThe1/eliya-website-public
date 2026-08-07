# Static pages plus Worker profile

This profile treats the static site and edge Worker as separate artifacts with
separate contracts. A static export must never make a server route "compatible"
by deleting it during the build.

This is the recommended starting profile for new exportable landing pages:
GitHub Pages serves a minimal reviewed static artifact, and a Cloudflare Worker
owns only the approved intake route and forwards to n8n. Selection remains an
approved brief decision. VPS/GHCR stay available when the prerequisites do not
fit.

## Repository shape

- The static app contains only routes that can be exported.
- The Worker owns the approved API paths and is packaged from an explicit file
  list.
- Shared request/response fixtures are copied into both test suites or generated
  from one frozen contract before parallel implementation begins.
- The platform route configuration maps only the approved API paths to the
  Worker; all other paths continue to the static host.

If a Next.js server route and the static app currently share one app tree,
refactor them into separate build targets before selecting this profile. Do not
use a CI step such as `rm -rf src/app/api`.

## Build artifacts

These scripts target GNU/Linux with Bash 4 or newer and GNU coreutils/findutils.
Before an offline release build, hydrate the pnpm store from the same frozen
lockfile with `pnpm install --frozen-lockfile`; the reviewed archive deliberately
uses `pnpm install --frozen-lockfile --offline` and will not contact a registry.

```bash
STATIC_BUILD_APPROVED=YES \
EXPECTED_COMMIT=<full-reviewed-commit> \
STATIC_APP_DIR=app \
STATIC_OUTPUT_DIR=app/out \
STATIC_ARTIFACT_DIR=/absolute/new/artifact/site \
./deployment/static-pages-worker/build-static.sh

WORKER_PACKAGE_APPROVED=YES \
EXPECTED_COMMIT=<full-reviewed-commit> \
WORKER_SOURCE_DIR=/absolute/repo/worker \
WORKER_FILE_LIST=/absolute/repo/deployment/static-pages-worker/worker-files.txt \
WORKER_ARTIFACT_DIR=/absolute/new/artifact/worker \
./deployment/static-pages-worker/package-worker.sh
```

Both artifact directories must not exist, and both artifact parents must
already exist at canonical non-symlink paths outside the checkout. The scripts
create artifacts without removing or overwriting another path. Building and
packaging do not deploy.

Static creation re-executes the packager from the exact full
`EXPECTED_COMMIT`, materializes that commit with `git archive`, installs only
the frozen offline dependency graph in the private archive, and runs
`pnpm build:release` there. It rejects symlinks/non-regular entries and
source-output changes during packaging, cleans incomplete artifacts, and writes
`.foundation-provenance.json` with a SHA-256 digest for every packaged file.
The provenance is derived from an immutable private source snapshot, checked
exhaustively in a private sibling staging directory, atomically published
without replacing a raced destination, and checked again after publication.
The source-bound build receipt therefore comes from the same immutable archive.
Ordinary `pnpm build` and `pnpm build:static` remain suitable
for dirty worktree validation and intentionally do not claim release
provenance.

Adapt `worker-files.example.txt` into a reviewed, tracked `worker-files.txt`.
Run packaging from a clean canonical Git checkout whose `HEAD` is the full
`EXPECTED_COMMIT`. Every listed Worker file must be a regular tracked file at
that commit; symlinks, canonical path escapes, local provider state, and
untracked inputs are rejected. The artifact includes
`.foundation-provenance.json` with the source commit and SHA-256 digest of each
packaged file. Never add a secret or local provider state.

Generated intake repositories include a fail-closed `worker/` workspace pinned
to Wrangler, required Cloudflare secret names for n8n delivery, an exact Worker
package file list, a manual protected-environment Cloudflare workflow, the
private-to-public Pages handoff, and
`docs/PROVIDER-VERIFIER-TASK.md`.

The generated Worker workflow deliberately does not request setup-node's pnpm
cache before pnpm exists. It enables Corepack immediately after Node setup and
before the first pnpm command. If caching is added later, install a SHA-pinned
pnpm setup action before `actions/setup-node` and retain the structural workflow
test.

They also include `foundation/paired-provider-release.json` and
`docs/PAIRED-PROVIDER-RELEASE.md`. Before either provider changes, freeze exact
candidate and previous Pages/Worker identities, separate approvals, ordered
non-activating Worker upload, Pages activation, 100% Worker activation, and
exact rollback/forward-fix commands. The manifest is an operator plan, not
provider evidence, and cannot make the release check pass.

The Worker workflow refuses deployment while
`worker/IMPLEMENTATION-BLOCKER.md` exists. Implement the full durable Worker
contract and parity tests before removing it. Store `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` in the protected GitHub environment, and store the n8n
URL/signing/deduplication values only as Cloudflare Worker secrets. Do not pass
n8n secrets through GitHub workflow inputs.

Follow `CLOUDFLARE-WORKER-SETUP.md` for the provider-mutation boundaries.
Worker bootstrap and every secret create/rotation require separate approval.
Do not use `wrangler secret put` or dashboard secret edits as setup shortcuts:
they can activate a new version. A provider-aware task must freeze a
non-activating bootstrap/versioned-secret path before the first deployment.

## Static intake provider evidence

This foundation does not pretend that a provider-independent Worker can supply
durable rate limiting, deduplication, secret storage, and route ownership.
Static sites with lead or booking intake therefore remain release-blocked until
the real Worker is implemented and verified on the selected provider and a
provider-specific attestation verifier is implemented in the generated site.
Static sites with no intake do not require this verifier.

After protected deployment and a fictional synthetic submission, copy
`worker-release-receipt.example.json` to
`foundation/static-worker-receipt.json`, replace every `REQUIRED_*` value, and
set `contract.submissionType` to the reviewed `lead` or `booking` intake mode,
and commit it as an operator evidence record. The generic release gate validates
its shape, route, exact submission discriminator, owner, source history, and
client runtime/content drift, but it deliberately does not trust its
hand-entered artifact hashes, Worker commit, provider reference, or control
booleans. Consequently this record cannot make `release:check` pass for lead or
booking intake. A selected provider integration must add an authentic verifier
that binds the GitHub Pages deployment to the exact private source/static
artifact and validates Cloudflare route ownership plus the deployed Worker
identity against the exact packaged provenance before the explicit blocker may
be removed.

The generic foundation deliberately keeps this blocker unconditional because
GitHub repository/environment and Cloudflare account/zone/version identities
are project-specific. Complete the generated provider-verifier task with fresh
authenticated API responses; workflow success or copied hashes are not enough.

Run `bash deployment/static-pages-worker/test-build-static.sh` and
`bash deployment/static-pages-worker/test-package-worker.sh` to exercise the
reviewed commit/blob paths, live-source and ignored-output races, canonical
destination boundaries, dirty-checkout rejection, provenance, and symlink
rejection.

See `worker-contract.md` for runtime requirements.
