#!/usr/bin/env bash
set -euo pipefail

# Run a command with line-buffered output and [backend] prefix
run_with_prefix() {
  stdbuf -oL -eL "$@" 2>&1 | sed 's/^/[backend] /'
}

if ! npx --no-install supabase --version >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install it with 'npm install supabase --save-dev' and run 'npx supabase init'." >&2
  exit 1
fi

# Check for env file in common locations
env_args=()
for env_file in "supabase/.env"; do
  if [ -f "$env_file" ]; then
    env_args+=(--env-file "$env_file")
    echo "Using env file: $env_file"
    break
  fi
done

cleanup() {
  run_with_prefix npx --no-install supabase stop 2>/dev/null || true
}
trap cleanup EXIT INT TERM

run_with_prefix npx --no-install supabase start
run_with_prefix npx --no-install supabase functions serve api "${env_args[@]}"
