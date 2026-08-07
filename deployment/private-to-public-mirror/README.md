# Private-to-public mirror gate

This optional layer creates a public-review artifact from one exact private
source commit. It is additive: source validation, privacy review, and deployment
approval still apply. It never becomes the source of truth and never deploys.
The preparation script targets GNU/Linux with Bash 4 or newer and GNU
coreutils/findutils.

1. Copy `publication-allowlist.example` to a reviewed allowlist.
2. Run `prepare-public-artifact.sh` into a new, empty path.
3. Run repository leak/placeholder checks against that artifact.
4. Review every image, document, generated source map, and identifier manually.
5. Record approval using `docs/templates/publication-review.md`.
6. Only then may a separate, repository-specific process commit the artifact to
   the public mirror. That process must still require an explicit approval.

```bash
PUBLICATION_REVIEW_APPROVED=YES \
PRIVATE_REPO=/absolute/private/repo \
SOURCE_COMMIT=<full-reviewed-commit> \
PUBLICATION_ALLOWLIST=/absolute/private/repo/deployment/private-to-public-mirror/publication-allowlist \
PUBLIC_ARTIFACT_DIR=/absolute/new/public-artifact \
./deployment/private-to-public-mirror/prepare-public-artifact.sh
```

The script uses an allowlist rather than a denylist. The allowlist itself must
be the canonical exact tracked blob at the reviewed commit. Directory entries
are expanded to exact regular tracked blobs before extraction; forbidden path
components, symlinks, submodules, special entries, changed bytes, and common
secret markers fail closed. Preparation occurs in a private sibling temporary
directory and is atomically renamed only after exhaustive validation, so a
failure leaves no partial public artifact. Publication uses no-replace
semantics, so a destination that appears during the final rename is preserved
and the operation fails. It deliberately does not push to GitHub.

Run `bash deployment/private-to-public-mirror/test-prepare-public-artifact.sh`
to exercise canonical paths, recursive forbidden descendants, tracked
symlinks, leak cleanup, and exact allowlist expansion.

## Minimal GitHub Pages handoff

For the recommended static profile, prefer
`prepare-pages-publication.sh` over publishing the private source tree. It
verifies an exact external static artifact and creates a new public artifact
containing only `site/`, provenance, a verifier, and a manual pinned Pages
workflow. Follow `GITHUB-PAGES-HANDOFF.md`.

This handoff still requires separate public-history review, publication
approval, and protected Pages deployment approval. It does not authenticate
the final provider deployment and cannot remove the static-intake release
blocker. Pages configuration is performed only inside the protected deployment
job with explicit Pages/OIDC permissions, after the read-only verification job
has produced the exact reviewed archive. Automatic Pages enablement is disabled;
the separately approved repository configuration must already exist.
