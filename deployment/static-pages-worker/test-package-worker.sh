#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
package_script="$script_dir/package-worker.sh"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/foundation-worker-package.XXXXXX")"

cleanup() {
  if [[ "$test_root" == "${TMPDIR:-/tmp}/foundation-worker-package."* ]]; then
    rm -rf -- "$test_root"
  fi
}
trap cleanup EXIT

repo="$test_root/repo"
artifacts="$test_root/artifacts"
mkdir -p "$repo/worker/src" "$repo/deployment" "$artifacts"
git -C "$repo" init --quiet --initial-branch=main
git -C "$repo" config user.name "Foundation test"
git -C "$repo" config user.email "foundation-test@example.invalid"

printf '%s\n' 'export default { fetch() { return new Response("ok"); } };' \
  >"$repo/worker/src/index.js"
printf '%s\n' 'name = "test-worker"' 'main = "src/index.js"' \
  >"$repo/worker/wrangler.toml"
printf '%s\n' 'src/index.js' 'wrangler.toml' \
  >"$repo/deployment/worker-files.txt"
git -C "$repo" add .
git -C "$repo" commit --quiet -m "test: add reviewed Worker fixture"
expected_commit="$(git -C "$repo" rev-parse HEAD)"

valid_artifact="$artifacts/valid"
WORKER_PACKAGE_APPROVED=YES \
EXPECTED_COMMIT="$expected_commit" \
WORKER_SOURCE_DIR="$repo/worker" \
WORKER_FILE_LIST="$repo/deployment/worker-files.txt" \
WORKER_ARTIFACT_DIR="$valid_artifact" \
  "$package_script"

test "$(cat "$valid_artifact/.source-commit")" = "$expected_commit"
node -e \
  'const fs=require("node:fs"); const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if(p.sourceCommit!==process.argv[2]||p.files.length!==2) process.exit(1)' \
  "$valid_artifact/.foundation-provenance.json" \
  "$expected_commit"
expected_digest="$(sha256sum "$valid_artifact/src/index.js" | cut -d' ' -f1)"
grep -F \
  "\"path\": \"src/index.js\", \"sha256\": \"$expected_digest\"" \
  "$valid_artifact/.foundation-provenance.json" >/dev/null

ln -s "$repo/worker" "$test_root/worker-link"
if WORKER_PACKAGE_APPROVED=YES \
  EXPECTED_COMMIT="$expected_commit" \
  WORKER_SOURCE_DIR="$test_root/worker-link" \
  WORKER_FILE_LIST="$repo/deployment/worker-files.txt" \
  WORKER_ARTIFACT_DIR="$artifacts/source-symlink" \
    "$package_script" >/dev/null 2>&1; then
  echo "ERROR: package script accepted a symlinked Worker source." >&2
  exit 1
fi

printf '%s\n' "unreviewed" >"$repo/worker/untracked.txt"
if WORKER_PACKAGE_APPROVED=YES \
  EXPECTED_COMMIT="$expected_commit" \
  WORKER_SOURCE_DIR="$repo/worker" \
  WORKER_FILE_LIST="$repo/deployment/worker-files.txt" \
  WORKER_ARTIFACT_DIR="$artifacts/dirty" \
    "$package_script" >/dev/null 2>&1; then
  echo "ERROR: package script accepted a dirty Worker checkout." >&2
  exit 1
fi
rm "$repo/worker/untracked.txt"

ln -s index.js "$repo/worker/src/link.js"
printf '%s\n' 'src/index.js' 'src/link.js' 'wrangler.toml' \
  >"$repo/deployment/worker-files.txt"
git -C "$repo" add .
git -C "$repo" commit --quiet -m "test: add forbidden Worker symlink"
symlink_commit="$(git -C "$repo" rev-parse HEAD)"
if WORKER_PACKAGE_APPROVED=YES \
  EXPECTED_COMMIT="$symlink_commit" \
  WORKER_SOURCE_DIR="$repo/worker" \
  WORKER_FILE_LIST="$repo/deployment/worker-files.txt" \
  WORKER_ARTIFACT_DIR="$artifacts/file-symlink" \
    "$package_script" >/dev/null 2>&1; then
  echo "ERROR: package script accepted a listed symlink." >&2
  exit 1
fi

echo "Worker packaging security tests passed."
