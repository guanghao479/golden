#!/usr/bin/env bash
set -euo pipefail

if ! npx --no-install supabase --version >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install it with 'npm install supabase --save-dev' and run 'npx supabase init'." >&2
  exit 1
fi

env_file="supabase/.env.local"
env_args=()
if [ -f "$env_file" ]; then
  env_args+=(--env-file "$env_file")
fi

cleanup() {
  npx --no-install supabase stop 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npx --no-install supabase start
stdbuf -oL -eL npx --no-install supabase functions serve api "${env_args[@]}" 2>&1 | sed 's/^/[backend] /'
