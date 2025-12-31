#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install it from https://supabase.com/docs/guides/cli." >&2
  exit 1
fi

env_file="supabase/.env.local"
env_args=()
if [ -f "$env_file" ]; then
  env_args+=(--env-file "$env_file")
fi

cleanup() {
  supabase stop 2>/dev/null || true
}
trap cleanup EXIT INT TERM

supabase start
stdbuf -oL -eL supabase functions serve api "${env_args[@]}" 2>&1 | sed 's/^/[backend] /'
