# GitHub Pages public-mirror handoff

Use this handoff when the private generated repository remains authoritative
and the public repository should contain only the approved static artifact,
its provenance, a verifier, and a manual Pages workflow.

1. From the exact clean private release commit, run the static profile's
   `build-static.sh` into a new external artifact directory.
2. Obtain explicit approval to prepare the public review artifact.
3. Run:

   ```bash
   PUBLICATION_REVIEW_APPROVED=YES \
   PRIVATE_REPO=/absolute/private/repository \
   SOURCE_COMMIT=<full-private-release-commit> \
   STATIC_ARTIFACT_DIR=/absolute/static-artifact \
   PUBLIC_ARTIFACT_DIR=/absolute/new-pages-handoff \
   ./deployment/private-to-public-mirror/prepare-pages-publication.sh
   ```

4. Run leak checks and inspect every public file/media item. Record approval
   with `docs/templates/publication-review.md`.
5. In the public mirror, commit the handoff without rewriting its files. Push
   only after explicit publication approval.
6. Configure GitHub Pages to use GitHub Actions. Protect the `github-pages`
   environment with required reviewers. The workflow's `configure-pages` action
   runs inside that protected deployment job, where the explicit `pages: write`
   and `id-token: write` permissions apply; the read-only verification job has
   no Pages API access. The action has `enablement: false`, so missing
   preconfiguration fails closed instead of creating or changing a Pages site.
7. Manually dispatch `pages-release.yml` with the exact public commit, private
   source commit, and static provenance SHA-256 recorded in
   `foundation/pages-publication.json`.

The workflow verifies the exact public commit and every static artifact digest,
then creates a Pages tar that retains reviewed provenance dotfiles before the
protected deployment. It never builds from public mutable source. Publication
approval, Pages deployment approval, Worker deployment approval, and provider
attestation verification remain separate decisions.
