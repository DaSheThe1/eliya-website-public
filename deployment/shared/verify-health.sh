#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <https-or-http-health-url> <expected-version> [attempts] [interval-seconds]" >&2
}

health_url="${1:-}"
expected_version="${2:-}"
attempts="${3:-30}"
interval="${4:-2}"

if [[ -z "$health_url" || -z "$expected_version" ]]; then
  usage
  exit 2
fi
if [[ ! "$health_url" =~ ^https?://[^[:space:]]+$ ]]; then
  echo "ERROR: health URL must be an explicit http(s) URL." >&2
  exit 2
fi
if [[ ! "$attempts" =~ ^[1-9][0-9]*$ || ! "$interval" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: attempts and interval must be positive integers." >&2
  exit 2
fi

for command in curl jq; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: required command is unavailable: $command" >&2
    exit 1
  fi
done

last_body=""
for ((attempt = 1; attempt <= attempts; attempt++)); do
  if body="$(curl --fail --silent --show-error --max-time 10 "$health_url" 2>/dev/null)"; then
    last_body="$body"
    if jq --exit-status --arg version "$expected_version" \
      '.ok == true and .version == $version' <<<"$body" >/dev/null; then
      echo "Health verified at $health_url (version $expected_version)."
      exit 0
    fi
  fi

  if (( attempt < attempts )); then
    sleep "$interval"
  fi
done

echo "ERROR: health did not report ok=true and version=$expected_version." >&2
if [[ -n "$last_body" ]]; then
  echo "Last response: $last_body" >&2
fi
exit 1
