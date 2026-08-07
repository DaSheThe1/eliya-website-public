# אליה יצחק — מאמנת שיווקית ומנטלית לעסקי ביוטי

Independent client site generated from Landing Page Foundation
`0.2.0` at `8ae96c89b5b9df9f2529f462de530d4e63cb8aa8`.

Read `AGENTS.md`, `foundation/site-brief.json`,
`foundation/generation-record.json`,
`foundation/content-manifest.json`, `foundation/runtime-contract.json`,
and `docs/AGENT-HANDOFF.md` before editing.

The generated application still contains an explicitly labeled fictional
fixture. Replace it with approved, source-backed client content, then run
`pnpm content:bind` with the owner's approval record. The command refuses to
approve content while original fixture fingerprints remain and binds approval
to exact content/configuration hashes. The owner must appear in the brief and
the source must exactly match an approved `content.authority` entry.

`pnpm build` and `pnpm validate` are development checks and may run with
uncommitted task changes. `pnpm build:release` is reserved for
deployment/static packaging from the exact clean source commit; it writes the
cryptographic production build receipt.

Run `pnpm preview:check` before sharing a preview. Any selected module whose
manifest records `client-implementation-required` remains blocked until every
exact implementation and browser-test path frozen in
`foundation/generation-record.json` exists as a regular file and every frozen
module validation command passes. Editing a copied module manifest cannot
remove that immutable blocker; only implementing and testing the selected
contract can satisfy it. `pnpm release:check` enforces the same gate.

The recommended deployment journey for this repository is an exact static
artifact handed to a minimal public GitHub Pages mirror plus a separately
packaged Cloudflare Worker for n8n intake. Pages publication and Worker
deployment use manual protected-environment workflows and require separate
current approvals. See `docs/GITHUB-PAGES-HANDOFF.md`.

The generated Worker intentionally fails closed and
cannot deploy while `worker/IMPLEMENTATION-BLOCKER.md` exists. After the
reviewed Worker is implemented, release still remains blocked until
`foundation/paired-provider-release.json` contains exact candidate/previous
identities and approvals and `docs/PROVIDER-VERIFIER-TASK.md` is completed
with provider-authenticated GitHub Pages and Cloudflare verification.


