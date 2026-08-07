#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/foundation-public-artifact.XXXXXX")"
cleanup() {
  if [[ "$test_root" == "${TMPDIR:-/tmp}/foundation-public-artifact."* ]]; then
    rm -rf -- "$test_root"
  fi
}
trap cleanup EXIT

repo="$test_root/repo"
artifacts="$test_root/artifacts"
mkdir -p \
  "$repo/deployment/private-to-public-mirror" \
  "$repo/src/nested" \
  "$repo/public" \
  "$artifacts"
cp "$script_dir/prepare-public-artifact.sh" \
  "$repo/deployment/private-to-public-mirror/prepare-public-artifact.sh"
chmod +x "$repo/deployment/private-to-public-mirror/prepare-public-artifact.sh"
printf '%s\n' \
  'src' \
  'public/robots.txt' \
  >"$repo/deployment/private-to-public-mirror/publication-allowlist"
printf '%s\n' 'export const fixture = "reviewed";' >"$repo/src/index.ts"
printf '%s\n' 'nested reviewed file' >"$repo/src/nested/data.txt"
printf '%s\n' 'User-agent: *' >"$repo/public/robots.txt"

git -C "$repo" init --quiet --initial-branch=main
git -C "$repo" config user.name "Foundation test"
git -C "$repo" config user.email "foundation-test@example.invalid"
git -C "$repo" add .
git -C "$repo" commit --quiet -m "test: add public mirror fixture"
source_commit="$(git -C "$repo" rev-parse HEAD)"
allowlist="$repo/deployment/private-to-public-mirror/publication-allowlist"

run_prepare() {
  PUBLICATION_REVIEW_APPROVED=YES \
  PRIVATE_REPO="$repo" \
  SOURCE_COMMIT="$source_commit" \
  PUBLICATION_ALLOWLIST="$allowlist" \
  PUBLIC_ARTIFACT_DIR="$1" \
    "$repo/deployment/private-to-public-mirror/prepare-public-artifact.sh"
}

run_prepare "$artifacts/valid" >/dev/null
test -f "$artifacts/valid/src/index.ts"
test -f "$artifacts/valid/src/nested/data.txt"
test -f "$artifacts/valid/public/robots.txt"
test "$(cat "$artifacts/valid/.source-commit")" = "$source_commit"
test "$(find "$artifacts/valid" -type f | wc -l)" -eq 4

symlink_parent="$test_root/artifact-link"
ln -s "$repo" "$symlink_parent"
if run_prepare "$symlink_parent/escaped" >/dev/null 2>&1; then
  echo "ERROR: public mirror accepted a symlinked destination parent." >&2
  exit 1
fi
test ! -e "$repo/escaped"

printf '%s%s\n' 'N8N_WEBHOOK_' 'URL=https://secret.invalid' >"$repo/src/leak.txt"
git -C "$repo" add src/leak.txt
git -C "$repo" commit --quiet -m "test: add detected leak"
source_commit="$(git -C "$repo" rev-parse HEAD)"
if run_prepare "$artifacts/content-leak" >/dev/null 2>&1; then
  echo "ERROR: public mirror accepted a common secret marker." >&2
  exit 1
fi
test ! -e "$artifacts/content-leak"
git -C "$repo" rm --quiet src/leak.txt
git -C "$repo" commit --quiet -m "test: remove detected leak"

printf '%s\n' 'TRACKED_SECRET=forbidden' >"$repo/src/.env.production"
git -C "$repo" add -f src/.env.production
git -C "$repo" commit --quiet -m "test: add forbidden env path"
source_commit="$(git -C "$repo" rev-parse HEAD)"
if run_prepare "$artifacts/env-descendant" >/dev/null 2>&1; then
  echo "ERROR: public mirror accepted a forbidden descendant of an allowed directory." >&2
  exit 1
fi
test ! -e "$artifacts/env-descendant"
git -C "$repo" rm --quiet -f src/.env.production
git -C "$repo" commit --quiet -m "test: remove forbidden env path"

ln -s nested/data.txt "$repo/src/link"
git -C "$repo" add src/link
git -C "$repo" commit --quiet -m "test: add forbidden symlink"
source_commit="$(git -C "$repo" rev-parse HEAD)"
if run_prepare "$artifacts/symlink-entry" >/dev/null 2>&1; then
  echo "ERROR: public mirror accepted a tracked symlink." >&2
  exit 1
fi
test ! -e "$artifacts/symlink-entry"
git -C "$repo" rm --quiet src/link
git -C "$repo" commit --quiet -m "test: remove forbidden symlink"

real_mv="$(command -v mv)"
race_bin="$test_root/race-bin"
race_target="$test_root/race-target"
mkdir "$race_bin" "$race_target"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'destination="${!#}"' \
  'if [[ "${FAKE_CREATE_DESTINATION_RACE:-}" == "YES" ]]; then' \
  '  ln -s "$FAKE_RACE_TARGET" "$destination"' \
  'fi' \
  'exec "$REAL_MV" "$@"' \
  >"$race_bin/mv"
chmod +x "$race_bin/mv"
source_commit="$(git -C "$repo" rev-parse HEAD)"
if PATH="$race_bin:$PATH" \
  REAL_MV="$real_mv" \
  FAKE_CREATE_DESTINATION_RACE=YES \
  FAKE_RACE_TARGET="$race_target" \
  PUBLICATION_REVIEW_APPROVED=YES \
  PRIVATE_REPO="$repo" \
  SOURCE_COMMIT="$source_commit" \
  PUBLICATION_ALLOWLIST="$allowlist" \
  PUBLIC_ARTIFACT_DIR="$artifacts/destination-race" \
    "$repo/deployment/private-to-public-mirror/prepare-public-artifact.sh" \
    >/dev/null 2>&1; then
  echo "ERROR: public mirror replaced a destination created during publication." >&2
  exit 1
fi
test -L "$artifacts/destination-race"
test "$(realpath -e "$artifacts/destination-race")" = "$race_target"
rm "$artifacts/destination-race"

if find "$artifacts" -maxdepth 1 -name '.foundation-public-artifact.*' \
  -print -quit | grep -q .; then
  echo "ERROR: public mirror left an incomplete staging directory." >&2
  exit 1
fi

echo "Generic public-mirror canonical, exhaustive, and cleanup tests passed."
