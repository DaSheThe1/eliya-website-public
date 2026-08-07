# Paired GitHub Pages and Cloudflare Worker release

`foundation/paired-provider-release.json` is the machine-readable activation
and recovery plan for one static/Worker candidate. It is not provider evidence
and cannot remove the release blocker.

Before any provider mutation:

1. Replace the candidate `REQUIRED_*` values with exact provider identities
   and set its state to `exact`. Set `previousRelease` either to a complete
   exact identity object with state `exact`, or to
   `{"state":"first-release"}` for a true first release.
2. Bind the private source commit, public mirror commit, public branch/tag
   workflow ref, Pages artifact and deployment IDs, static provenance, Worker
   package provenance, Worker version, script, and route to one reviewed
   candidate. The authenticated verifier must prove that the workflow ref
   resolved to the exact public commit.
3. Record separate current approvals for candidate review, non-activating Worker
   upload, Pages activation, Worker activation, and rollback or forward fix.
4. Upload the Worker as a non-activating version where the selected Cloudflare
   account supports version uploads. Do not use an activating deploy shortcut.
5. Deploy Pages, activate the exact Worker version at 100%, then run the fresh
   provider-authenticated verifier. Stop after any failure.

The manifest contains exact command templates for restoring the prior Pages
artifact and prior Worker version, plus the forward-fix path. Resolve every
placeholder before approval. Capture previous identities before changing either
provider; screenshots, copied hashes, workflow success, and this manifest are
not authority.

The current generic Worker workflow is deploy-capable and therefore remains
unsuitable for this ordered journey until the site-specific platform task
freezes a non-activating upload and separately approved version activation
path. Release stays fail closed through `docs/PROVIDER-VERIFIER-TASK.md`.
