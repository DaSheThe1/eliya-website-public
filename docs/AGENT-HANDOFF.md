# Agent handoff — eliya-thebeautybrand

## Read first

- `AGENTS.md`
- `foundation/site-brief.json`
- `foundation/generation-record.json`
- `foundation/content-manifest.json`
- `foundation/runtime-contract.json`
- the assigned JSON task packet and generated prompt

## Commands

- `pnpm install --frozen-lockfile` once per fresh clone or worktree
- `pnpm contracts:validate`
- `pnpm task:collisions -- <concurrent-task-a.json> <concurrent-task-b.json>`
- `pnpm task:scope -- --task <task.json>`
- `pnpm handoff:validate -- --task <task.json> --handoff <handoff.json> --require-ready`
- `pnpm validate`
- `pnpm preview:check` before sharing a preview; selected implementation
  contracts remain blocked until their exact app/test paths exist and their
  frozen module validation commands pass
- `pnpm test:e2e` for UI, navigation, or contact-flow changes
- `pnpm build:release` only for the deployment/release owner after the exact
  source commit is clean; Docker/static packaging must call this command
- `pnpm release:check -- foundation/site-brief.json` only after all
  production content and approvals are resolved
- `docs/GITHUB-PAGES-HANDOFF.md` for the reviewed public Pages artifact
- `pnpm worker:test` before packaging any intake Worker
- `deployment/static-pages-worker/CLOUDFLARE-WORKER-SETUP.md` before any Worker bootstrap or secret mutation
- `foundation/paired-provider-release.json` and `docs/PAIRED-PROVIDER-RELEASE.md` before either provider mutation
- `docs/PROVIDER-VERIFIER-TASK.md` remains a release blocker until implemented


The implementation agent returns handoff JSON in its final response. The
coordinator stores it outside the task worktree and validates it against the
exact packet with `--require-ready` before integration. Reviewers are
read-only and return structured findings; QA fixes use a separate task.
