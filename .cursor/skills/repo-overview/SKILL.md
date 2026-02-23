---
name: repo-overview
description: Provides an overview of repository structure, branches, and how branches differ from each other. Use when the user asks for a repo overview, branch summary, how branches differ, or what changed between branches.
---

# Repo Overview

## Quick Start

When the user asks for a repo overview or branch comparison:

1. Run the branch summary script (or equivalent commands)
2. Summarize the output in plain language—file count, approximate scope, commit count
3. Do not list individual files unless explicitly asked

## Workflow

### Repo structure overview

```bash
# List top-level directories and key files
ls -la
```

Describe the main areas (e.g., backend/, frontend/, docs/) in one or two sentences.

### Branch listing

```bash
git branch -a
```

Note which branch is current (`*`), and distinguish local vs remote branches.

### Branch comparison (summary only)

Use the utility script:

```bash
./.cursor/skills/repo-overview/scripts/branch-summary.sh [base-branch]
```

Or manually:

```bash
# Compare branch to main (or another base)
git diff --stat main..<branch>
git log --oneline main..<branch> | wc -l
```

**Output format**: Summarize as "Branch X has ~N changed files, +A/-B lines, M commits ahead of main." Do not enumerate files.

### Comparing two specific branches

```bash
git diff --stat <base>..<compare>
git log --oneline <base>..<compare> | wc -l
```

## Utility Script

**branch-summary.sh**: Produces a high-level summary of all branches vs a base branch (default: main).

```bash
./.cursor/skills/repo-overview/scripts/branch-summary.sh [base-branch]
```

The script outputs: branch name, file count, insertions/deletions, commit count. Run from repo root.

## Summary Checklist

- [ ] Describe repo structure in 1–2 sentences
- [ ] List branches (current, local, remote)
- [ ] For comparisons: file count, line delta, commit count only
- [ ] No per-file breakdown unless requested
