#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <canonical-git-root> <full-reviewed-commit>" >&2
}

repository_root="${1:-}"
source_commit="${2:-}"
if [[ -z "$repository_root" || -z "$source_commit" ]]; then
  usage
  exit 2
fi
if [[ "$repository_root" != /* || "$repository_root" == "/" ]]; then
  echo "ERROR: repository root must be an explicit absolute directory." >&2
  exit 2
fi
if [[ ! "$source_commit" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: source commit must be a full lowercase 40-character Git SHA." >&2
  exit 2
fi
for command in cat chmod git mktemp realpath rm tar; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: required command is unavailable: $command" >&2
    exit 1
  fi
done

canonical_root="$(realpath -e -- "$repository_root")"
git_root="$(git -C "$canonical_root" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ "$repository_root" != "$canonical_root" ]] ||
  [[ -z "$git_root" ]] ||
  [[ "$(realpath -e -- "$git_root")" != "$canonical_root" ]]; then
  echo "ERROR: repository root must be the canonical root of its Git checkout." >&2
  exit 2
fi
git -C "$canonical_root" cat-file -e "$source_commit^{commit}"
if git -C "$canonical_root" cat-file -e \
  "$source_commit:.foundation-build-source-commit" 2>/dev/null; then
  echo "ERROR: reviewed source may not track the reserved build-context marker." >&2
  exit 1
fi

temporary_root="$(realpath -e -- "${TMPDIR:-/tmp}")"
build_context="$(mktemp -d "$temporary_root/foundation-build-context.XXXXXX")"
cleanup_required=true
cleanup() {
  if [[ "$cleanup_required" == "true" ]] &&
    [[ "$build_context" == "$temporary_root/foundation-build-context."* ]]; then
    rm -rf -- "$build_context"
  fi
}
trap cleanup EXIT

git -C "$canonical_root" archive --format=tar "$source_commit" |
  tar -xf - -C "$build_context"
printf '%s\n' "$source_commit" \
  >"$build_context/.foundation-build-source-commit"
chmod 0444 "$build_context/.foundation-build-source-commit"

if [[ -e "$build_context/.git" ]] ||
  [[ "$(cat "$build_context/.foundation-build-source-commit")" != \
    "$source_commit" ]]; then
  echo "ERROR: deterministic build context verification failed." >&2
  exit 1
fi

cleanup_required=false
printf '%s\n' "$build_context"
