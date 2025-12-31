#!/usr/bin/env bash
set -euo pipefail

stdbuf -oL -eL bash -c "cd frontend && npm run dev" 2>&1 | sed 's/^/[frontend] /'
