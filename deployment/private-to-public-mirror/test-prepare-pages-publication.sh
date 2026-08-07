#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/foundation-pages-handoff.XXXXXX")"
cleanup() {
  if [[ "$test_root" == "${TMPDIR:-/tmp}/foundation-pages-handoff."* ]]; then
    rm -r -- "$test_root"
  fi
}
trap cleanup EXIT

repo="$test_root/repo"
static_artifact="$test_root/static"
mkdir -p \
  "$repo/deployment/private-to-public-mirror" \
  "$static_artifact/en"
cp "$script_dir/prepare-pages-publication.sh" \
  "$script_dir/verify-pages-artifact.sh" \
  "$script_dir/create-pages-archive.sh" \
  "$script_dir/github-pages-release.yml" \
  "$repo/deployment/private-to-public-mirror/"
chmod +x \
  "$repo/deployment/private-to-public-mirror/prepare-pages-publication.sh" \
  "$repo/deployment/private-to-public-mirror/verify-pages-artifact.sh" \
  "$repo/deployment/private-to-public-mirror/create-pages-archive.sh"
printf '%s\n' '<!doctype html><title>Fixture</title>' >"$static_artifact/index.html"
printf '%s\n' '<!doctype html><title>English</title>' >"$static_artifact/en/index.html"
: >"$static_artifact/.nojekyll"

git -C "$repo" init --quiet --initial-branch=main
git -C "$repo" config user.name "Foundation test"
git -C "$repo" config user.email "foundation-test@example.invalid"
git -C "$repo" add .
git -C "$repo" commit --quiet -m "test: pages handoff controls"
source_commit="$(git -C "$repo" rev-parse HEAD)"
printf '%s\n' "$source_commit" >"$static_artifact/.source-commit"
jq --null-input \
  --arg source "$source_commit" \
  --arg root "$(sha256sum "$static_artifact/index.html" | cut -d' ' -f1)" \
  --arg en "$(sha256sum "$static_artifact/en/index.html" | cut -d' ' -f1)" \
  --arg marker "$(sha256sum "$static_artifact/.source-commit" | cut -d' ' -f1)" \
  --arg nojekyll "$(sha256sum "$static_artifact/.nojekyll" | cut -d' ' -f1)" \
  '{
    schemaVersion: "1",
    sourceCommit: $source,
    files: [
      {path: ".nojekyll", sha256: $nojekyll},
      {path: ".source-commit", sha256: $marker},
      {path: "en/index.html", sha256: $en},
      {path: "index.html", sha256: $root}
    ]
  }' >"$static_artifact/.foundation-provenance.json"

output="$test_root/public"
PUBLICATION_REVIEW_APPROVED=YES \
PRIVATE_REPO="$repo" \
SOURCE_COMMIT="$source_commit" \
STATIC_ARTIFACT_DIR="$static_artifact" \
PUBLIC_ARTIFACT_DIR="$output" \
  "$repo/deployment/private-to-public-mirror/prepare-pages-publication.sh" \
  >/dev/null
test -f "$output/site/index.html"
test -f "$output/.github/workflows/pages-release.yml"
test -x "$output/scripts/verify-pages-artifact.sh"
test -x "$output/scripts/create-pages-archive.sh"
grep -F "workflow_dispatch:" \
  "$output/.github/workflows/pages-release.yml" >/dev/null
grep -F "name: github-pages" \
  "$output/.github/workflows/pages-release.yml" >/dev/null
grep -F "test \"\$TRIGGER_COMMIT\" = \"\$PUBLIC_COMMIT\"" \
  "$output/.github/workflows/pages-release.yml" >/dev/null
grep -F "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02" \
  "$output/.github/workflows/pages-release.yml" >/dev/null
if grep -Eq '^\s+push:|uses: [^[:space:]]+@v[0-9]+' \
  "$output/.github/workflows/pages-release.yml"; then
  echo "ERROR: Pages workflow is automatic or uses an unpinned action tag." >&2
  exit 1
fi
provenance_sha="$(sha256sum "$output/site/.foundation-provenance.json" | cut -d' ' -f1)"
PAGES_SITE_DIR="$output/site" \
PAGES_HANDOFF_FILE="$output/foundation/pages-publication.json" \
EXPECTED_SOURCE_COMMIT="$source_commit" \
EXPECTED_PROVENANCE_SHA256="$provenance_sha" \
  "$output/scripts/verify-pages-artifact.sh" >/dev/null

forbidden_site="$test_root/forbidden-site"
cp -a "$output/site" "$forbidden_site"
mkdir -p "$forbidden_site/.github"
printf '%s\n' 'not deployable' >"$forbidden_site/.github/config.yml"
forbidden_digest="$(sha256sum "$forbidden_site/.github/config.yml" | cut -d' ' -f1)"
jq --arg digest "$forbidden_digest" \
  '.files += [{path: ".github/config.yml", sha256: $digest}]' \
  "$forbidden_site/.foundation-provenance.json" \
  >"$test_root/forbidden-provenance.json"
mv "$test_root/forbidden-provenance.json" \
  "$forbidden_site/.foundation-provenance.json"
forbidden_provenance_sha="$(
  sha256sum "$forbidden_site/.foundation-provenance.json" | cut -d' ' -f1
)"
jq --arg digest "$forbidden_provenance_sha" \
  '.staticProvenanceSha256 = $digest' \
  "$output/foundation/pages-publication.json" \
  >"$test_root/forbidden-handoff.json"
if PAGES_SITE_DIR="$forbidden_site" \
  PAGES_HANDOFF_FILE="$test_root/forbidden-handoff.json" \
  EXPECTED_SOURCE_COMMIT="$source_commit" \
  EXPECTED_PROVENANCE_SHA256="$forbidden_provenance_sha" \
    "$output/scripts/verify-pages-artifact.sh" >/dev/null 2>&1; then
  echo "ERROR: Pages verifier accepted an excluded .github path." >&2
  exit 1
fi

archive="$test_root/artifact.tar"
PAGES_SITE_DIR="$output/site" \
PAGES_ARCHIVE_FILE="$archive" \
  "$output/scripts/create-pages-archive.sh" >/dev/null
for required_entry in \
  "./.foundation-provenance.json" \
  "./.nojekyll" \
  "./.source-commit" \
  "./index.html"; do
  tar -tf "$archive" | grep -Fx "$required_entry" >/dev/null
done
extracted="$test_root/extracted"
mkdir "$extracted"
tar -xf "$archive" -C "$extracted"
PAGES_SITE_DIR="$extracted" \
PAGES_HANDOFF_FILE="$output/foundation/pages-publication.json" \
EXPECTED_SOURCE_COMMIT="$source_commit" \
EXPECTED_PROVENANCE_SHA256="$provenance_sha" \
  "$output/scripts/verify-pages-artifact.sh" >/dev/null

tamper_bin="$test_root/tamper-bin"
mkdir "$tamper_bin"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  '"$REAL_CP" "$@"' \
  'destination="${!#}"' \
  'if [[ "${1:-}" == "-a" && "${2:-}" == "$TAMPER_SOURCE/." ]]; then' \
  '  printf "%s\n" "copy drift" >>"$destination/index.html"' \
  'fi' >"$tamper_bin/cp"
chmod +x "$tamper_bin/cp"
tampered_output="$test_root/tampered-public"
if PATH="$tamper_bin:$PATH" \
  REAL_CP="$(command -v cp)" \
  TAMPER_SOURCE="$static_artifact" \
  PUBLICATION_REVIEW_APPROVED=YES \
  PRIVATE_REPO="$repo" \
  SOURCE_COMMIT="$source_commit" \
  STATIC_ARTIFACT_DIR="$static_artifact" \
  PUBLIC_ARTIFACT_DIR="$tampered_output" \
    "$repo/deployment/private-to-public-mirror/prepare-pages-publication.sh" \
    >/dev/null 2>&1; then
  echo "ERROR: Pages handoff accepted post-copy artifact drift." >&2
  exit 1
fi
test ! -e "$tampered_output"

printf '%s\n' 'drift' >>"$output/site/index.html"
if PAGES_SITE_DIR="$output/site" \
  PAGES_HANDOFF_FILE="$output/foundation/pages-publication.json" \
  EXPECTED_SOURCE_COMMIT="$source_commit" \
  EXPECTED_PROVENANCE_SHA256="$provenance_sha" \
  "$output/scripts/verify-pages-artifact.sh" >/dev/null 2>&1; then
  echo "ERROR: Pages verifier accepted artifact drift." >&2
  exit 1
fi

echo "GitHub Pages public-handoff provenance tests passed."
