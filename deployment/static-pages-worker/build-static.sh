#!/usr/bin/env bash
set -euo pipefail

if [[ "${STATIC_BUILD_APPROVED:-}" != "YES" ]]; then
  echo "ERROR: static artifact creation requires STATIC_BUILD_APPROVED=YES." >&2
  exit 1
fi
: "${EXPECTED_COMMIT:?set the full reviewed source commit}"
: "${STATIC_OUTPUT_DIR:?set STATIC_OUTPUT_DIR, usually app/out}"
: "${STATIC_ARTIFACT_DIR:?set a new absolute STATIC_ARTIFACT_DIR}"
static_app_dir="${STATIC_APP_DIR:-app}"

if [[ ! "$EXPECTED_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: EXPECTED_COMMIT must be a full lowercase 40-character git SHA." >&2
  exit 2
fi

for command in cat chmod cmp cp cut dirname find git grep jq mkdir mktemp mv pnpm realpath rm sha256sum sort tar; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: required command is unavailable: $command" >&2
    exit 1
  fi
done

repo_root="$(realpath -e -- "$(git rev-parse --show-toplevel)")"
temporary_root="$(realpath -e -- "${TMPDIR:-/tmp}")"
umask 077

validate_relative_directory() {
  local label="$1"
  local value="$2"
  if [[ -z "$value" || "$value" == /* || "$value" == "." ]] ||
    [[ "$value" == ./* || "$value" == */./* ]] ||
    [[ "$value" == ".." || "$value" == ../* || "$value" == */../* ]] ||
    [[ "$value" == */ || "$value" == *"//"* ]]; then
    echo "ERROR: $label must be a safe repository-relative directory." >&2
    exit 2
  fi
}

validate_relative_directory "STATIC_APP_DIR" "$static_app_dir"
validate_relative_directory "STATIC_OUTPUT_DIR" "$STATIC_OUTPUT_DIR"

static_app_path="$repo_root/$static_app_dir"
if [[ ! -d "$static_app_path" ]] ||
  [[ "$static_app_path" != "$(realpath -e -- "$static_app_path")" ]] ||
  [[ -L "$static_app_path" ]]; then
  echo "ERROR: STATIC_APP_DIR must be a canonical non-symlink directory." >&2
  exit 2
fi
output_parent="$repo_root/$(dirname "$STATIC_OUTPUT_DIR")"
if [[ ! -d "$output_parent" ]] ||
  [[ "$output_parent" != "$(realpath -e -- "$output_parent")" ]]; then
  echo "ERROR: STATIC_OUTPUT_DIR parent must be canonical and may not traverse symlinks." >&2
  exit 2
fi
source_dir="$repo_root/$STATIC_OUTPUT_DIR"
case "$source_dir/" in
  "$static_app_path/"*) ;;
  *)
    echo "ERROR: STATIC_OUTPUT_DIR must stay inside STATIC_APP_DIR." >&2
    exit 2
    ;;
esac
if [[ -L "$source_dir" ]]; then
  echo "ERROR: STATIC_OUTPUT_DIR may not be a symlink." >&2
  exit 2
fi

if [[ "$STATIC_ARTIFACT_DIR" != /* || "$STATIC_ARTIFACT_DIR" == "/" ]]; then
  echo "ERROR: STATIC_ARTIFACT_DIR must be an absolute non-root path." >&2
  exit 2
fi
artifact_parent="$(realpath -e -- "$(dirname "$STATIC_ARTIFACT_DIR")")"
artifact_dir="$artifact_parent/$(basename "$STATIC_ARTIFACT_DIR")"
if [[ "$STATIC_ARTIFACT_DIR" != "$artifact_dir" ]]; then
  echo "ERROR: STATIC_ARTIFACT_DIR must already be canonical and may not traverse symlinks." >&2
  exit 2
fi
case "$artifact_dir/" in
  "$repo_root/"*)
    echo "ERROR: static artifact must be outside the canonical source checkout." >&2
    exit 2
    ;;
esac
if [[ -e "$artifact_dir" || -L "$artifact_dir" ]]; then
  echo "ERROR: artifact path already exists; refusing to overwrite it." >&2
  exit 1
fi

verify_reviewed_source() {
  if [[ "$(git -C "$repo_root" rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
    echo "ERROR: checkout HEAD does not equal EXPECTED_COMMIT." >&2
    return 1
  fi
  if [[ -n "$(git -C "$repo_root" status --porcelain=v1 --untracked-files=all)" ]]; then
    echo "ERROR: source checkout is dirty; build from the exact reviewed commit." >&2
    git -C "$repo_root" status --short >&2
    return 1
  fi
}

git -C "$repo_root" cat-file -e "$EXPECTED_COMMIT^{commit}"
verify_reviewed_source

script_relative="deployment/static-pages-worker/build-static.sh"
control_root="${FOUNDATION_STATIC_CONTROL_ROOT:-}"
reviewed_runner=""
if [[ -n "$control_root" ]]; then
  reviewed_runner="$control_root/$script_relative"
fi
if [[ -z "$control_root" ]] ||
  [[ "$control_root" != "$temporary_root/foundation-static-controls."* ]] ||
  [[ ! -d "$control_root" ]] ||
  [[ ! -f "$reviewed_runner" ]] ||
  [[ -L "$reviewed_runner" ]] ||
  [[ "$(realpath -e -- "${BASH_SOURCE[0]}")" != "$(realpath -e -- "$reviewed_runner")" ]] ||
  [[ "$(git -C "$repo_root" hash-object "$reviewed_runner")" != \
    "$(git -C "$repo_root" rev-parse "$EXPECTED_COMMIT:$script_relative")" ]]; then
  control_root="$(mktemp -d "$temporary_root/foundation-static-controls.XXXXXX")"
  cleanup_bootstrap() {
    if [[ "$control_root" == "$temporary_root/foundation-static-controls."* ]]; then
      rm -rf -- "$control_root"
    fi
  }
  trap cleanup_bootstrap EXIT
  git -C "$repo_root" archive --format=tar "$EXPECTED_COMMIT" -- "$script_relative" |
    tar -xf - -C "$control_root"
  reviewed_runner="$control_root/$script_relative"
  if [[ ! -f "$reviewed_runner" ]] ||
    [[ -L "$reviewed_runner" ]] ||
    [[ "$(git -C "$repo_root" hash-object "$reviewed_runner")" != \
      "$(git -C "$repo_root" rev-parse "$EXPECTED_COMMIT:$script_relative")" ]]; then
    echo "ERROR: unable to materialize the exact reviewed static packager." >&2
    exit 1
  fi
  chmod 0500 "$reviewed_runner"
  trap - EXIT
  shopt -s execfail
  if ! FOUNDATION_STATIC_CONTROL_ROOT="$control_root" exec "$reviewed_runner"; then
    cleanup_bootstrap
    exit 1
  fi
fi

build_root=""
artifact_staging=""
artifact_published=false
packaging_complete=false
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "$build_root" ]] &&
    [[ "$build_root" == "$temporary_root/foundation-static-source."* ]]; then
    rm -rf -- "$build_root"
  fi
  if [[ "$control_root" == "$temporary_root/foundation-static-controls."* ]]; then
    rm -rf -- "$control_root"
  fi
  if [[ -n "$artifact_staging" ]] &&
    [[ "$artifact_staging" == "$artifact_parent/.foundation-static-artifact."* ]] &&
    [[ -d "$artifact_staging" ]]; then
    rm -rf -- "$artifact_staging"
  fi
  if [[ "$artifact_published" == true ]] &&
    [[ "$packaging_complete" != true ]] &&
    [[ -d "$artifact_dir" ]]; then
    rm -rf -- "$artifact_dir"
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if git -C "$repo_root" cat-file -e \
  "$EXPECTED_COMMIT:.foundation-build-source-commit" 2>/dev/null; then
  echo "ERROR: reviewed source contains the reserved build-context marker." >&2
  exit 1
fi
build_root="$(mktemp -d "$temporary_root/foundation-static-source.XXXXXX")"
git -C "$repo_root" archive --format=tar "$EXPECTED_COMMIT" | tar -xf - -C "$build_root"
if [[ -e "$build_root/.foundation-build-source-commit" ]] ||
  [[ -L "$build_root/.foundation-build-source-commit" ]]; then
  echo "ERROR: reserved build-context marker exists after source extraction." >&2
  exit 1
fi
printf '%s\n' "$EXPECTED_COMMIT" >"$build_root/.foundation-build-source-commit"

archived_app="$build_root/$static_app_dir"
archived_source="$build_root/$STATIC_OUTPUT_DIR"
if [[ ! -d "$archived_app" ]] ||
  [[ "$archived_app" != "$(realpath -e -- "$archived_app")" ]] ||
  [[ -L "$archived_app" ]]; then
  echo "ERROR: reviewed STATIC_APP_DIR is not a canonical regular directory." >&2
  exit 1
fi
case "$archived_source/" in
  "$archived_app/"*) ;;
  *)
    echo "ERROR: reviewed STATIC_OUTPUT_DIR escapes STATIC_APP_DIR." >&2
    exit 1
    ;;
esac

(
  cd "$build_root"
  pnpm install --frozen-lockfile --offline
  FOUNDATION_BUILD_CONTEXT=container \
  FOUNDATION_BUILD_SOURCE_COMMIT="$EXPECTED_COMMIT" \
    pnpm build:release
)

if [[ ! -d "$archived_source" ]] ||
  [[ "$archived_source" != "$(realpath -e -- "$archived_source")" ]] ||
  [[ ! -f "$archived_source/index.html" ]] ||
  [[ -L "$archived_source" ]]; then
  echo "ERROR: reviewed static output is missing an index.html." >&2
  exit 1
fi
if find "$archived_source" ! -type d ! -type f -print -quit | grep -q .; then
  echo "ERROR: static output contains a symlink or non-regular entry." >&2
  exit 1
fi
for reserved_output in .foundation-provenance.json .source-commit; do
  if [[ -e "$archived_source/$reserved_output" ]] ||
    [[ -L "$archived_source/$reserved_output" ]]; then
    echo "ERROR: static output contains reserved packaging metadata: $reserved_output" >&2
    exit 1
  fi
done

snapshot_files() {
  local root="$1"
  local destination="$2"
  : >"$destination"
  while IFS= read -r -d '' file; do
    relative="${file#"$root"/}"
    printf '%s  %s\n' \
      "$(sha256sum "$file" | cut -d' ' -f1)" \
      "$relative" >>"$destination"
  done < <(find "$root" -type f -print0 | sort -z)
}

source_before="$control_root/static-source-before.sha256"
source_after="$control_root/static-source-after.sha256"
artifact_snapshot="$control_root/static-artifact.sha256"
expected_artifact_snapshot="$control_root/static-artifact-expected.sha256"
published_artifact_snapshot="$control_root/static-artifact-published.sha256"
snapshot_files "$archived_source" "$source_before"

artifact_staging="$(mktemp -d "$artifact_parent/.foundation-static-artifact.XXXXXX")"
cp -a -- "$archived_source/." "$artifact_staging/"

snapshot_files "$archived_source" "$source_after"
snapshot_files "$artifact_staging" "$artifact_snapshot"
if ! cmp -s "$source_before" "$source_after" ||
  ! cmp -s "$source_before" "$artifact_snapshot"; then
  echo "ERROR: static output changed while the release artifact was snapshotted." >&2
  exit 1
fi

printf '%s\n' "$EXPECTED_COMMIT" >"$artifact_staging/.source-commit"
marker_sha256="$(
  printf '%s\n' "$EXPECTED_COMMIT" | sha256sum | cut -d' ' -f1
)"
{
  cat "$source_before"
  printf '%s  %s\n' "$marker_sha256" ".source-commit"
} | LC_ALL=C sort -k2 >"$expected_artifact_snapshot"

provenance_entries="$control_root/foundation-static-provenance.jsonl"
: >"$provenance_entries"
while IFS= read -r expected_entry; do
  sha256="${expected_entry%% *}"
  relative="${expected_entry#*  }"
  jq --compact-output --null-input \
    --arg path "$relative" \
    --arg sha256 "$sha256" \
    '{path: $path, sha256: $sha256}' >>"$provenance_entries"
done <"$expected_artifact_snapshot"
jq --slurp \
  --arg sourceCommit "$EXPECTED_COMMIT" \
  '{
    schemaVersion: "1",
    sourceCommit: $sourceCommit,
    files: .
  }' \
  "$provenance_entries" >"$artifact_staging/.foundation-provenance.json"

snapshot_files "$artifact_staging" "$artifact_snapshot"
grep -v '  \.foundation-provenance\.json$' \
  "$artifact_snapshot" >"$published_artifact_snapshot"
if ! cmp -s "$expected_artifact_snapshot" "$published_artifact_snapshot"; then
  echo "ERROR: staged static artifact differs from immutable expected provenance." >&2
  exit 1
fi
provenance_sha256="$(
  sha256sum "$artifact_staging/.foundation-provenance.json" | cut -d' ' -f1
)"

verify_reviewed_source
mv -T --no-clobber -- "$artifact_staging" "$artifact_dir"
if [[ -d "$artifact_staging" ]] || [[ ! -d "$artifact_dir" ]]; then
  echo "ERROR: static artifact destination appeared during publication." >&2
  exit 1
fi
artifact_published=true

snapshot_files "$artifact_dir" "$artifact_snapshot"
grep -v '  \.foundation-provenance\.json$' \
  "$artifact_snapshot" >"$published_artifact_snapshot"
if ! cmp -s "$expected_artifact_snapshot" "$published_artifact_snapshot" ||
  [[ "$(sha256sum "$artifact_dir/.foundation-provenance.json" | cut -d' ' -f1)" != \
    "$provenance_sha256" ]]; then
  echo "ERROR: published static artifact differs from its immutable source snapshot." >&2
  exit 1
fi
verify_reviewed_source
packaging_complete=true
echo "Created static artifact at $artifact_dir. No deployment was triggered."
