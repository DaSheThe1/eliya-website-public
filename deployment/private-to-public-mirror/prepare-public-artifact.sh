#!/usr/bin/env bash
set -euo pipefail

if [[ "${PUBLICATION_REVIEW_APPROVED:-}" != "YES" ]]; then
  echo "ERROR: artifact preparation requires PUBLICATION_REVIEW_APPROVED=YES." >&2
  exit 1
fi

required_vars=(
  PRIVATE_REPO
  SOURCE_COMMIT
  PUBLICATION_ALLOWLIST
  PUBLIC_ARTIFACT_DIR
)
for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: required environment variable is unset: $name" >&2
    exit 2
  fi
done
if [[ ! "$SOURCE_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: SOURCE_COMMIT must be a full lowercase 40-character git SHA." >&2
  exit 2
fi
for command in basename chmod dirname find git grep mkdir mktemp mv realpath rm sort wc; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: required command is unavailable: $command" >&2
    exit 1
  fi
done

for candidate in "$PRIVATE_REPO" "$PUBLICATION_ALLOWLIST" "$PUBLIC_ARTIFACT_DIR"; do
  if [[ "$candidate" != /* || "$candidate" == "/" ]]; then
    echo "ERROR: all paths must be explicit absolute non-root paths." >&2
    exit 2
  fi
done

private_repo="$(realpath -e -- "$PRIVATE_REPO")"
allowlist="$(realpath -e -- "$PUBLICATION_ALLOWLIST")"
if [[ "$PRIVATE_REPO" != "$private_repo" ]] ||
  [[ "$PUBLICATION_ALLOWLIST" != "$allowlist" ]] ||
  [[ -L "$PRIVATE_REPO" ]] ||
  [[ -L "$PUBLICATION_ALLOWLIST" ]] ||
  [[ ! -f "$allowlist" ]]; then
  echo "ERROR: source and allowlist paths must be canonical non-symlinks." >&2
  exit 2
fi
if [[ "$(realpath -e -- "$(git -C "$private_repo" rev-parse --show-toplevel)")" != \
  "$private_repo" ]]; then
  echo "ERROR: PRIVATE_REPO must be the canonical Git root." >&2
  exit 2
fi
case "$allowlist" in
  "$private_repo"/*) ;;
  *)
    echo "ERROR: publication allowlist must be tracked inside PRIVATE_REPO." >&2
    exit 2
    ;;
esac

artifact_parent="$(realpath -e -- "$(dirname "$PUBLIC_ARTIFACT_DIR")")"
public_artifact="$artifact_parent/$(basename "$PUBLIC_ARTIFACT_DIR")"
if [[ "$PUBLIC_ARTIFACT_DIR" != "$public_artifact" ]] ||
  [[ "$public_artifact" == "/" ]] ||
  [[ -e "$public_artifact" ]] ||
  [[ -L "$public_artifact" ]]; then
  echo "ERROR: PUBLIC_ARTIFACT_DIR must be a new canonical absolute path." >&2
  exit 2
fi
case "$public_artifact/" in
  "$private_repo/"*)
    echo "ERROR: public artifact must stay outside the private source checkout." >&2
    exit 2
    ;;
esac

if [[ "$(git -C "$private_repo" rev-parse HEAD)" != "$SOURCE_COMMIT" ]] ||
  [[ -n "$(git -C "$private_repo" status --porcelain=v1 --untracked-files=all)" ]]; then
  echo "ERROR: private source must be clean at SOURCE_COMMIT." >&2
  exit 1
fi
git -C "$private_repo" cat-file -e "$SOURCE_COMMIT^{commit}"

allowlist_relative="${allowlist#"$private_repo"/}"
allowlist_entry="$(git -C "$private_repo" ls-tree "$SOURCE_COMMIT" -- "$allowlist_relative")"
read -r allowlist_mode allowlist_type _allowlist_object _allowlist_name \
  <<<"$allowlist_entry"
if [[ "$allowlist_type" != "blob" ]] ||
  [[ "$allowlist_mode" != "100644" && "$allowlist_mode" != "100755" ]] ||
  [[ "$(git -C "$private_repo" hash-object "$allowlist")" != \
    "$(git -C "$private_repo" rev-parse "$SOURCE_COMMIT:$allowlist_relative")" ]]; then
  echo "ERROR: publication allowlist must be the exact regular tracked blob at SOURCE_COMMIT." >&2
  exit 1
fi

path_is_forbidden() {
  local relative="$1"
  local component
  local components=()
  IFS='/' read -r -a components <<<"$relative"
  for component in "${components[@]}"; do
    if [[ "$component" == .env* ]] ||
      [[ "$component" == .git* ]] ||
      [[ "$component" == .wrangler* ]]; then
      return 0
    fi
  done
  case "${components[-1]}" in
    *.key | *.pem | id_rsa | id_dsa | id_ecdsa | id_ed25519)
      return 0
      ;;
  esac
  return 1
}

declare -A selected_objects=()
declare -A selected_modes=()
while IFS= read -r relative || [[ -n "$relative" ]]; do
  [[ -z "$relative" || "$relative" == \#* ]] && continue
  if [[ ! "$relative" =~ ^[A-Za-z0-9._/-]+$ ]] ||
    [[ "$relative" == /* || "$relative" == ./* || "$relative" == */./* ]] ||
    [[ "$relative" == ".." || "$relative" == ../* || "$relative" == */../* ]] ||
    [[ "$relative" == */ || "$relative" == *"//"* ]] ||
    path_is_forbidden "$relative"; then
    echo "ERROR: unsafe publication path: $relative" >&2
    exit 1
  fi
  if ! git -C "$private_repo" cat-file -e "$SOURCE_COMMIT:$relative" 2>/dev/null; then
    echo "ERROR: publication path is absent from SOURCE_COMMIT: $relative" >&2
    exit 1
  fi

  while IFS= read -r -d '' tree_entry; do
    metadata="${tree_entry%%$'\t'*}"
    tracked_path="${tree_entry#*$'\t'}"
    read -r mode type object <<<"$metadata"
    if [[ "$type" != "blob" ]] ||
      [[ "$mode" != "100644" && "$mode" != "100755" ]] ||
      path_is_forbidden "$tracked_path"; then
      echo "ERROR: publication selection contains a forbidden or non-regular entry: $tracked_path" >&2
      exit 1
    fi
    if [[ -n "${selected_objects[$tracked_path]:-}" ]] &&
      [[ "${selected_objects[$tracked_path]}" != "$object" ]]; then
      echo "ERROR: publication selection resolves conflicting objects: $tracked_path" >&2
      exit 1
    fi
    selected_objects["$tracked_path"]="$object"
    selected_modes["$tracked_path"]="$mode"
  done < <(git -C "$private_repo" ls-tree -r -z --full-tree "$SOURCE_COMMIT" -- "$relative")
done < <(git -C "$private_repo" show "$SOURCE_COMMIT:$allowlist_relative")

if (( ${#selected_objects[@]} == 0 )); then
  echo "ERROR: publication allowlist resolves no regular tracked files." >&2
  exit 1
fi

staging="$(mktemp -d "$artifact_parent/.foundation-public-artifact.XXXXXX")"
publication_complete=false
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ "$publication_complete" != true ]] &&
    [[ "$staging" == "$artifact_parent/.foundation-public-artifact."* ]] &&
    [[ -d "$staging" ]]; then
    rm -rf -- "$staging"
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

while IFS= read -r tracked_path; do
  destination="$staging/$tracked_path"
  mkdir -p -- "$(dirname "$destination")"
  git -C "$private_repo" cat-file blob "${selected_objects[$tracked_path]}" >"$destination"
  if [[ "${selected_modes[$tracked_path]}" == "100755" ]]; then
    chmod 0755 "$destination"
  else
    chmod 0644 "$destination"
  fi
done < <(printf '%s\n' "${!selected_objects[@]}" | LC_ALL=C sort)

while IFS= read -r -d '' extracted; do
  relative="${extracted#"$staging"/}"
  if [[ -d "$extracted" ]]; then
    continue
  fi
  if [[ ! -f "$extracted" ]] ||
    [[ -L "$extracted" ]] ||
    path_is_forbidden "$relative" ||
    [[ -z "${selected_objects[$relative]:-}" ]] ||
    [[ "$(git -C "$private_repo" hash-object "$extracted")" != \
      "${selected_objects[$relative]}" ]]; then
    echo "ERROR: extracted artifact contains an undeclared, changed, or unsafe entry: $relative" >&2
    exit 1
  fi
done < <(find "$staging" -mindepth 1 -print0)

actual_count="$(find "$staging" -type f -print | wc -l)"
if [[ "$actual_count" -ne "${#selected_objects[@]}" ]]; then
  echo "ERROR: extracted artifact does not exactly match the expanded allowlist." >&2
  exit 1
fi

if grep -rIlE \
  'BEGIN (OPENSSH |RSA |EC )?PRIVATE KEY|N8N_WEBHOOK_(URL|SIGNING_SECRET|SECRET)=' \
  "$staging" >/dev/null 2>&1; then
  echo "ERROR: common secret/private-key marker found in public artifact." >&2
  exit 1
fi

printf '%s\n' "$SOURCE_COMMIT" >"$staging/.source-commit"
mv -T --no-clobber -- "$staging" "$public_artifact"
if [[ -d "$staging" ]] || [[ ! -d "$public_artifact" ]]; then
  echo "ERROR: public artifact destination appeared during publication." >&2
  exit 1
fi
publication_complete=true
(
  cd "$public_artifact"
  find . -type f -print | LC_ALL=C sort
)
echo "Prepared review artifact only. No commit, push, or deployment occurred."
