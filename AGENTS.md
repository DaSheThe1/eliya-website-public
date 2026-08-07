# Agent playbook — eliya-thebeautybrand

Read this file, `README.md`, `foundation/site-brief.json`, and
`foundation/generation-record.json`,
`foundation/content-manifest.json`, and `docs/AGENT-HANDOFF.md` before
editing.

## Purpose

This is the independent client-site repository for
אליה יצחק — מאמנת שיווקית ומנטלית לעסקי ביוטי. The validated brief is the content and
configuration authority. Never reintroduce the fictional foundation fixture
as real client content.

## Workflow

- `main` is stable; agents work on `task/<id>-<role>` branches created from
  the exact full base commit in their task packet.
- Claude normally owns presentation and UI tests. Codex normally owns server
  routes, intake, deployment, and security. The coordinator owns contracts,
  versions, lockfiles, integration, and release.
- Stay inside the packet write allowlist. Return the required handoff JSON in
  your response; the coordinator stores it outside the task worktree.
- Never deploy, publish, merge, or change live infrastructure without explicit
  owner approval.

## Non-invention and security

Unknown identity, offer, claims, proof, contact details, policies, analytics,
and media stay unresolved and block release. Never commit secrets or real
`.env` files. Keep server-only values out of browser code and logs. Validate
and bound all form data on the server.

## Validation and versioning

Run `pnpm install --frozen-lockfile` once in every fresh clone or worktree,
then run `pnpm validate` before handoff and the relevant
Playwright/deployment checks for changed behavior. Validation builds are
expected to run with uncommitted task changes and do not write a release
receipt. Only the deployment/release owner runs `pnpm build:release`, from
the exact clean source commit that will be packaged. Runtime, contract,
generator-derived, or deployment changes require a semver bump in root and app
`package.json` plus a dated `CHANGELOG.md` entry in the same commit.
