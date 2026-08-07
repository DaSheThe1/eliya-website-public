#!/usr/bin/env bash
set -euo pipefail

if [[ "${WORKER_PACKAGE_APPROVED:-}" != "YES" ]]; then
  echo "ERROR: Worker packaging requires WORKER_PACKAGE_APPROVED=YES." >&2
  exit 1
fi
: "${WORKER_SOURCE_DIR:?set an absolute WORKER_SOURCE_DIR}"
: "${WORKER_FILE_LIST:?set an absolute WORKER_FILE_LIST}"
: "${WORKER_ARTIFACT_DIR:?set a new absolute WORKER_ARTIFACT_DIR}"
: "${EXPECTED_COMMIT:?set the full reviewed source commit}"

for path in "$WORKER_SOURCE_DIR" "$WORKER_FILE_LIST" "$WORKER_ARTIFACT_DIR"; do
  if [[ "$path" != /* || "$path" == "/" || "$path" == *".."* ]]; then
    echo "ERROR: Worker paths must be explicit absolute non-root paths." >&2
    exit 2
  fi
done
if [[ ! "$EXPECTED_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: EXPECTED_COMMIT must be a full lowercase 40-character git SHA." >&2
  exit 2
fi
if [[ ! -d "$WORKER_SOURCE_DIR" || ! -f "$WORKER_FILE_LIST" ]]; then
  echo "ERROR: Worker source directory or file list is missing." >&2
  exit 1
fi
if [[ -e "$WORKER_ARTIFACT_DIR" ]]; then
  echo "ERROR: Worker artifact path already exists; refusing to overwrite it." >&2
  exit 1
fi
for command in git realpath sha256sum; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: required command is unavailable: $command" >&2
    exit 1
  fi
done

repo_root="$(git -C "$WORKER_SOURCE_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: WORKER_SOURCE_DIR is not inside a Git checkout." >&2
  exit 1
fi
repo_root="$(realpath -e -- "$repo_root")"
source_dir="$(realpath -e -- "$WORKER_SOURCE_DIR")"
file_list="$(realpath -e -- "$WORKER_FILE_LIST")"
artifact_parent="$(realpath -e -- "$(dirname "$WORKER_ARTIFACT_DIR")")"
artifact_dir="$artifact_parent/$(basename "$WORKER_ARTIFACT_DIR")"

if [[ "$WORKER_SOURCE_DIR" != "$source_dir" ]] ||
  [[ "$WORKER_FILE_LIST" != "$file_list" ]] ||
  [[ "$WORKER_ARTIFACT_DIR" != "$artifact_dir" ]]; then
  echo "ERROR: Worker paths must already be canonical and may not traverse symlinks." >&2
  exit 2
fi
case "$source_dir/" in
  "$repo_root/"*) ;;
  *)
    echo "ERROR: Worker source directory escapes the canonical Git root." >&2
    exit 2
    ;;
esac
case "$file_list" in
  "$repo_root"/*) ;;
  *)
    echo "ERROR: Worker file list must be tracked inside the canonical Git root." >&2
    exit 2
    ;;
esac
case "$artifact_dir/" in
  "$repo_root/"*)
    echo "ERROR: Worker artifact must be outside the canonical Git checkout." >&2
    exit 2
    ;;
esac
if [[ -L "$WORKER_SOURCE_DIR" || -L "$WORKER_FILE_LIST" ]]; then
  echo "ERROR: Worker source and file list may not be symlinks." >&2
  exit 2
fi
if [[ "$(git -C "$repo_root" rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: checkout HEAD does not equal EXPECTED_COMMIT." >&2
  exit 1
fi
if [[ -n "$(git -C "$repo_root" status --porcelain=v1 --untracked-files=all)" ]]; then
  echo "ERROR: Worker source checkout is dirty; package a reviewed commit." >&2
  git -C "$repo_root" status --short >&2
  exit 1
fi
git -C "$repo_root" cat-file -e "$EXPECTED_COMMIT^{commit}"

source_relative="${source_dir#"$repo_root"}"
source_relative="${source_relative#/}"
file_list_relative="${file_list#"$repo_root"/}"
file_list_entry="$(git -C "$repo_root" ls-tree "$EXPECTED_COMMIT" -- "$file_list_relative")"
read -r file_list_mode file_list_type _object _name <<<"$file_list_entry"
if [[ "$file_list_type" != "blob" ]] ||
  [[ "$file_list_mode" != "100644" && "$file_list_mode" != "100755" ]] ||
  [[ "$(git -C "$repo_root" hash-object "$file_list")" != \
    "$(git -C "$repo_root" rev-parse "$EXPECTED_COMMIT:$file_list_relative")" ]]; then
  echo "ERROR: Worker file list is not a regular tracked file at EXPECTED_COMMIT." >&2
  exit 1
fi

files=()
declare -A seen_files=()
while IFS= read -r relative || [[ -n "$relative" ]]; do
  [[ -z "$relative" || "$relative" == \#* ]] && continue
  if [[ ! "$relative" =~ ^[A-Za-z0-9._/-]+$ ]] ||
    [[ "$relative" == /* || "$relative" == ./* || "$relative" == */./* ]] ||
    [[ "$relative" == ".." || "$relative" == ../* || "$relative" == */../* ]] ||
    [[ "$relative" == */ || "$relative" == *"//"* ]]; then
    echo "ERROR: unsafe path in Worker file list: $relative" >&2
    exit 1
  fi
  if [[ "$relative" == .env* || "$relative" == */.env* ]] ||
    [[ "$relative" == .wrangler || "$relative" == .wrangler/* ]] ||
    [[ "$relative" == */.wrangler || "$relative" == */.wrangler/* ]]; then
    echo "ERROR: local secrets/provider state cannot enter the Worker artifact: $relative" >&2
    exit 1
  fi
  if [[ -n "${seen_files[$relative]:-}" ]]; then
    echo "ERROR: duplicate path in Worker file list: $relative" >&2
    exit 1
  fi
  seen_files["$relative"]=1

  source_path="$source_dir/$relative"
  if [[ ! -f "$source_path" || -L "$source_path" ]]; then
    echo "ERROR: listed Worker file is missing: $relative" >&2
    exit 1
  fi
  canonical_source_path="$(realpath -e -- "$source_path")"
  case "$canonical_source_path" in
    "$source_dir"/*) ;;
    *)
      echo "ERROR: listed Worker file escapes the canonical source directory: $relative" >&2
      exit 1
      ;;
  esac

  repo_relative="${source_relative:+$source_relative/}$relative"
  tree_entry="$(git -C "$repo_root" ls-tree "$EXPECTED_COMMIT" -- "$repo_relative")"
  read -r mode type _object _name <<<"$tree_entry"
  if [[ "$type" != "blob" ]] ||
    [[ "$mode" != "100644" && "$mode" != "100755" ]]; then
    echo "ERROR: listed Worker path is not a regular tracked file: $relative" >&2
    exit 1
  fi
  if [[ "$(git -C "$repo_root" hash-object "$source_path")" != \
    "$(git -C "$repo_root" rev-parse "$EXPECTED_COMMIT:$repo_relative")" ]]; then
    echo "ERROR: listed Worker file differs from EXPECTED_COMMIT: $relative" >&2
    exit 1
  fi
  files+=("$relative")
done < <(git -C "$repo_root" show "$EXPECTED_COMMIT:$file_list_relative")

if (( ${#files[@]} == 0 )); then
  echo "ERROR: Worker file list is empty." >&2
  exit 1
fi

mkdir "$WORKER_ARTIFACT_DIR"
for relative in "${files[@]}"; do
  destination="$WORKER_ARTIFACT_DIR/$relative"
  mkdir -p "$(dirname "$destination")"
  repo_relative="${source_relative:+$source_relative/}$relative"
  git -C "$repo_root" show "$EXPECTED_COMMIT:$repo_relative" >"$destination"
  mode="$(git -C "$repo_root" ls-tree "$EXPECTED_COMMIT" -- "$repo_relative" | cut -d' ' -f1)"
  if [[ "$mode" == "100755" ]]; then
    chmod 0755 "$destination"
  else
    chmod 0644 "$destination"
  fi
done

if grep -rIlE \
  'BEGIN (OPENSSH |RSA |EC )?PRIVATE KEY' \
  "$WORKER_ARTIFACT_DIR" >/dev/null 2>&1; then
  echo "ERROR: common private-key marker found in Worker artifact." >&2
  exit 1
fi

printf '%s\n' "$EXPECTED_COMMIT" >"$WORKER_ARTIFACT_DIR/.source-commit"
{
  printf '{\n  "schemaVersion": "1",\n  "sourceCommit": "%s",\n  "files": [\n' \
    "$EXPECTED_COMMIT"
  for index in "${!files[@]}"; do
    relative="${files[$index]}"
    digest="$(sha256sum "$WORKER_ARTIFACT_DIR/$relative" | cut -d' ' -f1)"
    separator=","
    if (( index == ${#files[@]} - 1 )); then
      separator=""
    fi
    printf '    {"path": "%s", "sha256": "%s"}%s\n' \
      "$relative" "$digest" "$separator"
  done
  printf '  ]\n}\n'
} >"$WORKER_ARTIFACT_DIR/.foundation-provenance.json"

echo "Created Worker artifact at $WORKER_ARTIFACT_DIR. No deployment was triggered."
