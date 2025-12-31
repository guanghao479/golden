#!/usr/bin/env bash
set -euo pipefail

pids=()

cleanup() {
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

./scripts/dev-backend.sh &
pids+=("$!")

./scripts/dev-frontend.sh &
pids+=("$!")

wait
