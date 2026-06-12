#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "== Running test harness =="
echo "Project root: $PROJECT_ROOT"

if [ -f package.json ]; then
  if npm run | grep -q "test"; then
    npm test
  else
    echo "No npm test script found in package.json."
  fi
elif [ -f pyproject.toml ] || [ -f pytest.ini ]; then
  python -m pytest
elif [ -f requirements.txt ]; then
  python -m pytest
else
  echo "No known test setup found."
fi
