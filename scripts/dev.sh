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

stdbuf -oL -eL make backend 2>&1 | sed 's/^/[backend] /' &
pids+=("$!")

stdbuf -oL -eL make frontend 2>&1 | sed 's/^/[frontend] /' &
pids+=("$!")

wait
