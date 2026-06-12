#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "== Git status =="
echo "Project root: $PROJECT_ROOT"
git status --short || true

echo
echo "== Git diff stat =="
git diff --stat || true

echo
echo "== Git diff =="
git diff || true
