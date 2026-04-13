#!/bin/bash
# Pre-Commit Quality Gate
# Blocks git commit if build, lint, or unit tests fail.
# Used as Claude Code PreToolUse hook on Bash(git commit *).

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^git commit'; then
  exit 0
fi

PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
if [ -z "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(pwd)"
fi

cd "$PROJECT_DIR"

FAILED=""

# 1. Lint check
echo "Pre-commit: Running lint..." >&2
if ! npm run lint --silent 2>&1; then
  FAILED="${FAILED}  - npm run lint failed\n"
fi

# 2. Build check
echo "Pre-commit: Running build..." >&2
if ! npm run build --silent 2>&1; then
  FAILED="${FAILED}  - npm run build failed\n"
fi

# 3. Unit tests
echo "Pre-commit: Running unit tests..." >&2
if ! npm test --silent 2>&1; then
  FAILED="${FAILED}  - npm test failed\n"
fi

if [ -n "$FAILED" ]; then
  echo "Commit blocked by pre-commit quality gate:" >&2
  echo -e "$FAILED" >&2
  echo "Fix the issues above before committing." >&2
  exit 2
fi

echo "Pre-commit: All checks passed." >&2
exit 0
