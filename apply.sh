#!/usr/bin/env bash
# Run from the ROOT of your commercial-operations-ai repository, on a new branch.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -d app ] && [ -f AGENTS.md ] || { echo "Run this from the repository root."; exit 1; }
while IFS= read -r f; do [ -n "$f" ] && git rm -q --ignore-unmatch -- "$f" 2>/dev/null || rm -f -- "$f"; done < "$HERE/delete.txt"
cp -R "$HERE/files/." .
git add -A
echo "Done. Review with: git status"
echo "Then run: (cd app && npm ci && npm test) and (cd ai-service && python -m venv .venv && . .venv/bin/activate && pip install -e '.[dev]' && python -m pytest)"
