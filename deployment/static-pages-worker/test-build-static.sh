#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/foundation-static-build.XXXXXX")"

cleanup() {
  if [[ "$test_root" == "${TMPDIR:-/tmp}/foundation-static-build."* ]]; then
    rm -rf -- "$test_root"
  fi
}
trap cleanup EXIT

repo="$test_root/repo"
fake_bin="$test_root/bin"
artifacts="$test_root/artifacts"
mkdir -p \
  "$repo/app" \
  "$repo/deployment/static-pages-worker" \
  "$fake_bin" \
  "$artifacts"
cp "$script_dir/build-static.sh" \
  "$repo/deployment/static-pages-worker/build-static.sh"
chmod +x "$repo/deployment/static-pages-worker/build-static.sh"
printf '%s\n' 'out/' >"$repo/.gitignore"
printf '%s\n' '{"scripts":{"build:release":"fixture"}}' >"$repo/package.json"
printf '%s\n' '{"name":"fixture-app","private":true}' >"$repo/app/package.json"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'if [[ "$*" == "install --frozen-lockfile --offline" ]]; then exit 0; fi' \
  'test "$*" = "build:release"' \
  'if [[ -n "${FAKE_LIVE_SOURCE:-}" ]]; then' \
  '  original="$(cat "$FAKE_LIVE_SOURCE")"' \
  '  printf "%s\n" "unreviewed live mutation" >"$FAKE_LIVE_SOURCE"' \
  '  test "$(cat "$FAKE_LIVE_SOURCE")" = "unreviewed live mutation"' \
  '  printf "%s\n" "$original" >"$FAKE_LIVE_SOURCE"' \
  'fi' \
  'mkdir -p app/out/en' \
  'printf "%s\n" "<!doctype html><title>Fixture</title>" >app/out/index.html' \
  'printf "%s\n" "<!doctype html><title>English</title>" >app/out/en/index.html' \
  >"$fake_bin/pnpm"
chmod +x "$fake_bin/pnpm"

git -C "$repo" init --quiet --initial-branch=main
git -C "$repo" config user.name "Foundation test"
git -C "$repo" config user.email "foundation-test@example.invalid"
git -C "$repo" add .
git -C "$repo" commit --quiet -m "test: add static fixture"
source_commit="$(git -C "$repo" rev-parse HEAD)"

(
  cd "$repo"
  PATH="$fake_bin:$PATH" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$source_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$artifacts/valid" \
  FAKE_LIVE_SOURCE="$repo/package.json" \
    ./deployment/static-pages-worker/build-static.sh
)
grep -F '"build:release":"fixture"' "$repo/package.json" >/dev/null
grep -F '<title>Fixture</title>' "$artifacts/valid/index.html" >/dev/null
jq --exit-status --arg commit "$source_commit" \
  '.sourceCommit == $commit and
   (.files | any(.path == "index.html")) and
   (.files | all(.sha256 | test("^[0-9a-f]{64}$")))' \
  "$artifacts/valid/.foundation-provenance.json" >/dev/null

wrong_commit="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
if (
  cd "$repo"
  PATH="$fake_bin:$PATH" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$wrong_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$artifacts/wrong-commit" \
    ./deployment/static-pages-worker/build-static.sh >/dev/null 2>&1
); then
  echo "ERROR: static build accepted the wrong reviewed commit." >&2
  exit 1
fi

printf '%s\n' "dirty" >"$repo/untracked.txt"
if (
  cd "$repo"
  PATH="$fake_bin:$PATH" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$source_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$artifacts/dirty" \
    ./deployment/static-pages-worker/build-static.sh >/dev/null 2>&1
); then
  echo "ERROR: static build accepted a dirty checkout." >&2
  exit 1
fi
rm "$repo/untracked.txt"

mkdir "$repo/escaped-artifacts"
ln -s "$repo/escaped-artifacts" "$test_root/artifact-link"
if (
  cd "$repo"
  PATH="$fake_bin:$PATH" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$source_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$test_root/artifact-link/escaped" \
    ./deployment/static-pages-worker/build-static.sh >/dev/null 2>&1
); then
  echo "ERROR: static build accepted a symlinked artifact parent." >&2
  exit 1
fi
if [[ -e "$repo/escaped-artifacts/escaped" ]]; then
  echo "ERROR: static build wrote through a symlink into the source checkout." >&2
  exit 1
fi

tamper_bin="$test_root/tamper-bin"
mkdir "$tamper_bin"
real_cp="$(command -v cp)"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  '"$REAL_CP" "$@"' \
  'if [[ "${1:-}" == "-a" && "${2:-}" == "--" && "${3:-}" == */app/out/. ]]; then' \
  '  printf "%s\n" "ignored output mutation" >>"${3%/.}/index.html"' \
  'fi' \
  >"$tamper_bin/cp"
chmod +x "$tamper_bin/cp"
if (
  cd "$repo"
  PATH="$tamper_bin:$fake_bin:$PATH" \
  REAL_CP="$real_cp" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$source_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$artifacts/output-race" \
    ./deployment/static-pages-worker/build-static.sh >/dev/null 2>&1
); then
  echo "ERROR: static build accepted ignored output mutation during packaging." >&2
  exit 1
fi
test ! -e "$artifacts/output-race"
rm "$tamper_bin/cp"

real_jq="$(command -v jq)"
injection_marker="$test_root/provenance-injection-ran"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'if [[ "${FAKE_INJECT_BEFORE_PROVENANCE:-}" == "YES" && ! -e "$FAKE_INJECTION_MARKER" ]]; then' \
  '  staging="$(find "$FAKE_ARTIFACT_PARENT" -maxdepth 1 -type d -name ".foundation-static-artifact.*" -print -quit)"' \
  '  test -n "$staging"' \
  '  printf "%s\n" "post-comparison injection" >>"$staging/index.html"' \
  '  touch "$FAKE_INJECTION_MARKER"' \
  'fi' \
  'exec "$REAL_JQ" "$@"' \
  >"$tamper_bin/jq"
chmod +x "$tamper_bin/jq"
if (
  cd "$repo"
  PATH="$tamper_bin:$fake_bin:$PATH" \
  REAL_JQ="$real_jq" \
  FAKE_INJECT_BEFORE_PROVENANCE=YES \
  FAKE_INJECTION_MARKER="$injection_marker" \
  FAKE_ARTIFACT_PARENT="$artifacts" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$source_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$artifacts/provenance-race" \
    ./deployment/static-pages-worker/build-static.sh >/dev/null 2>&1
); then
  echo "ERROR: static build blessed a post-comparison artifact injection." >&2
  exit 1
fi
test -e "$injection_marker"
test ! -e "$artifacts/provenance-race"
rm "$tamper_bin/jq"

printf '%s\n' "tracked marker" >"$repo/.foundation-build-source-commit"
git -C "$repo" add .foundation-build-source-commit
git -C "$repo" commit --quiet -m "test: add forbidden regular source marker"
source_commit="$(git -C "$repo" rev-parse HEAD)"
if (
  cd "$repo"
  PATH="$fake_bin:$PATH" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$source_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$artifacts/reserved-regular" \
    ./deployment/static-pages-worker/build-static.sh >/dev/null 2>&1
); then
  echo "ERROR: static build accepted a tracked reserved marker." >&2
  exit 1
fi
test ! -e "$artifacts/reserved-regular"
git -C "$repo" rm --quiet .foundation-build-source-commit
git -C "$repo" commit --quiet -m "test: remove forbidden regular source marker"

outside_marker="$test_root/outside-marker"
printf '%s\n' "outside sentinel" >"$outside_marker"
ln -s "$outside_marker" "$repo/.foundation-build-source-commit"
git -C "$repo" add .foundation-build-source-commit
git -C "$repo" commit --quiet -m "test: add forbidden marker symlink"
source_commit="$(git -C "$repo" rev-parse HEAD)"
if (
  cd "$repo"
  PATH="$fake_bin:$PATH" \
  STATIC_BUILD_APPROVED=YES \
  EXPECTED_COMMIT="$source_commit" \
  STATIC_APP_DIR=app \
  STATIC_OUTPUT_DIR=app/out \
  STATIC_ARTIFACT_DIR="$artifacts/reserved-symlink" \
    ./deployment/static-pages-worker/build-static.sh >/dev/null 2>&1
); then
  echo "ERROR: static build accepted a tracked reserved marker symlink." >&2
  exit 1
fi
test "$(cat "$outside_marker")" = "outside sentinel"
test ! -e "$artifacts/reserved-symlink"
git -C "$repo" rm --quiet .foundation-build-source-commit
git -C "$repo" commit --quiet -m "test: remove forbidden marker symlink"

if find "$test_root" "$artifacts" -maxdepth 1 \
  \( -name 'foundation-static-controls.*' -o \
    -name 'foundation-static-source.*' -o \
    -name '.foundation-static-artifact.*' \) \
  -print -quit | grep -q .; then
  echo "ERROR: static build left private reviewed material behind." >&2
  exit 1
fi

printf '%s\n' "Static build exact-source, race, path, and provenance tests passed."
