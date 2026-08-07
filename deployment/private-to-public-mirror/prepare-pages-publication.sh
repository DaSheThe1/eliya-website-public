#!/usr/bin/env bash
set -euo pipefail

if [[ "${PUBLICATION_REVIEW_APPROVED:-}" != "YES" ]]; then
  echo "ERROR: Pages handoff preparation requires PUBLICATION_REVIEW_APPROVED=YES." >&2
  exit 1
fi
required_vars=(
  PRIVATE_REPO
  SOURCE_COMMIT
  STATIC_ARTIFACT_DIR
  PUBLIC_ARTIFACT_DIR
)
for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: required environment variable is unset: $name" >&2
    exit 2
  fi
done
if [[ ! "$SOURCE_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: SOURCE_COMMIT must be a full lowercase 40-character Git SHA." >&2
  exit 2
fi
for command in basename chmod cp cut dirname git grep jq mkdir mktemp realpath rm sha256sum tar; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: required command is unavailable: $command" >&2
    exit 1
  fi
done

private_repo="$(realpath -e -- "$PRIVATE_REPO")"
static_artifact="$(realpath -e -- "$STATIC_ARTIFACT_DIR")"
if [[ "$PRIVATE_REPO" != "$private_repo" ]] ||
  [[ "$STATIC_ARTIFACT_DIR" != "$static_artifact" ]] ||
  [[ -L "$PRIVATE_REPO" ]] ||
  [[ -L "$STATIC_ARTIFACT_DIR" ]]; then
  echo "ERROR: source and static artifact paths must be canonical non-symlinks." >&2
  exit 2
fi
if [[ "$(realpath -e -- "$(git -C "$private_repo" rev-parse --show-toplevel)")" != \
  "$private_repo" ]]; then
  echo "ERROR: PRIVATE_REPO must be the canonical Git root." >&2
  exit 2
fi
artifact_parent="$(realpath -e -- "$(dirname "$PUBLIC_ARTIFACT_DIR")")"
public_artifact="$artifact_parent/$(basename "$PUBLIC_ARTIFACT_DIR")"
if [[ "$PUBLIC_ARTIFACT_DIR" != "$public_artifact" ]] ||
  [[ "$public_artifact" == "/" ]] ||
  [[ -e "$public_artifact" ]] ||
  [[ -L "$public_artifact" ]]; then
  echo "ERROR: PUBLIC_ARTIFACT_DIR must be a new canonical absolute path." >&2
  exit 2
fi
case "$static_artifact/" in
  "$private_repo/"*)
    echo "ERROR: static artifact must stay outside the private checkout." >&2
    exit 2
    ;;
esac
case "$public_artifact/" in
  "$private_repo/"* | "$static_artifact/"*)
    echo "ERROR: public artifact must stay outside source and static artifacts." >&2
    exit 2
    ;;
esac
if [[ "$(git -C "$private_repo" rev-parse HEAD)" != "$SOURCE_COMMIT" ]] ||
  [[ -n "$(git -C "$private_repo" status --porcelain=v1 --untracked-files=all)" ]]; then
  echo "ERROR: private source must be clean at SOURCE_COMMIT." >&2
  exit 1
fi
git -C "$private_repo" cat-file -e "$SOURCE_COMMIT^{commit}"

workflow_relative="deployment/private-to-public-mirror/github-pages-release.yml"
verifier_relative="deployment/private-to-public-mirror/verify-pages-artifact.sh"
archive_relative="deployment/private-to-public-mirror/create-pages-archive.sh"
for relative in "$workflow_relative" "$verifier_relative" "$archive_relative"; do
  entry="$(git -C "$private_repo" ls-tree "$SOURCE_COMMIT" -- "$relative")"
  read -r mode type _object _name <<<"$entry"
  if [[ "$type" != "blob" ]] ||
    [[ "$mode" != "100644" && "$mode" != "100755" ]]; then
    echo "ERROR: Pages handoff control is not a regular tracked file: $relative" >&2
    exit 1
  fi
done

provenance_file="$static_artifact/.foundation-provenance.json"
if [[ ! -f "$provenance_file" ]] || [[ -L "$provenance_file" ]]; then
  echo "ERROR: static artifact lacks regular provenance." >&2
  exit 1
fi
provenance_sha256="$(sha256sum "$provenance_file" | cut -d' ' -f1)"
temporary_handoff="$(mktemp "$artifact_parent/.foundation-pages-handoff.XXXXXX")"
temporary_controls=""
public_artifact_created=false
publication_complete=false
cleanup() {
  if [[ -f "$temporary_handoff" ]]; then
    rm "$temporary_handoff"
  fi
  if [[ -n "$temporary_controls" ]] && [[ -d "$temporary_controls" ]]; then
    rm -r -- "$temporary_controls"
  fi
  if [[ "$public_artifact_created" == true ]] &&
    [[ "$publication_complete" != true ]] &&
    [[ -d "$public_artifact" ]]; then
    rm -r -- "$public_artifact"
  fi
}
trap cleanup EXIT
jq --null-input \
  --arg source "$SOURCE_COMMIT" \
  --arg provenance "$provenance_sha256" \
  '{
    schemaVersion: "1.0",
    status: "prepared-unpublished",
    privateSourceCommit: $source,
    staticProvenanceSha256: $provenance
  }' >"$temporary_handoff"

temporary_controls="$(mktemp -d "$artifact_parent/.foundation-pages-controls.XXXXXX")"
git -C "$private_repo" archive --format=tar "$SOURCE_COMMIT" -- \
  "$workflow_relative" "$verifier_relative" "$archive_relative" |
  tar -xf - -C "$temporary_controls"
PAGES_SITE_DIR="$static_artifact" \
PAGES_HANDOFF_FILE="$temporary_handoff" \
EXPECTED_SOURCE_COMMIT="$SOURCE_COMMIT" \
EXPECTED_PROVENANCE_SHA256="$provenance_sha256" \
  "$temporary_controls/$verifier_relative" >/dev/null

mkdir "$public_artifact"
public_artifact_created=true
mkdir -p \
  "$public_artifact/.github/workflows" \
  "$public_artifact/foundation" \
  "$public_artifact/scripts" \
  "$public_artifact/site"
cp -a "$static_artifact/." "$public_artifact/site/"
cp "$temporary_handoff" "$public_artifact/foundation/pages-publication.json"
cp "$temporary_controls/$workflow_relative" \
  "$public_artifact/.github/workflows/pages-release.yml"
cp "$temporary_controls/$verifier_relative" \
  "$public_artifact/scripts/verify-pages-artifact.sh"
cp "$temporary_controls/$archive_relative" \
  "$public_artifact/scripts/create-pages-archive.sh"
chmod 0755 \
  "$public_artifact/scripts/verify-pages-artifact.sh" \
  "$public_artifact/scripts/create-pages-archive.sh"

PAGES_SITE_DIR="$public_artifact/site" \
PAGES_HANDOFF_FILE="$public_artifact/foundation/pages-publication.json" \
EXPECTED_SOURCE_COMMIT="$SOURCE_COMMIT" \
EXPECTED_PROVENANCE_SHA256="$provenance_sha256" \
  "$public_artifact/scripts/verify-pages-artifact.sh" >/dev/null

if grep -rIlE \
  'BEGIN (OPENSSH |RSA |EC )?PRIVATE KEY|N8N_WEBHOOK_(URL|SIGNING_SECRET)=' \
  "$public_artifact" >/dev/null 2>&1; then
  echo "ERROR: common secret/private-key marker found in Pages handoff." >&2
  exit 1
fi
publication_complete=true
echo "Prepared reviewed GitHub Pages handoff at $public_artifact."
echo "No Git commit, push, publication, or deployment occurred."
