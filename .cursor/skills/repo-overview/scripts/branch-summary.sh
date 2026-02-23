#!/usr/bin/env bash
# Branch summary: high-level stats for each branch vs base (default: main)
# Usage: ./branch-summary.sh [base-branch]
# Run from repo root.

set -e

BASE="${1:-main}"
BRANCHES=$(git branch | sed 's/^[* ]*//' | grep -v "^${BASE}$" || true)

if [ -z "$BRANCHES" ]; then
  echo "No branches to compare (base: $BASE)"
  exit 0
fi

echo "Branch summary (vs $BASE)"
echo "---"

for branch in $BRANCHES; do
  if ! git rev-parse "$branch" >/dev/null 2>&1; then
    continue
  fi
  if ! git merge-base "$BASE" "$branch" >/dev/null 2>&1; then
    echo "$branch: (no common ancestor)"
    continue
  fi
  stat=$(git diff --stat "$BASE".."$branch" 2>/dev/null | tail -1)
  commits=$(git log --oneline "$BASE".."$branch" 2>/dev/null | wc -l | tr -d ' ')
  echo "$branch: $stat | $commits commits"
done
