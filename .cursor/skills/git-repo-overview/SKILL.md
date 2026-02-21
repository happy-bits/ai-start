---
name: git-repo-overview
description: Provide a comprehensive overview of a Git repository including all branches, their relationships, activity, and contributors. Use when the user asks for a repo overview, wants to understand the branch structure, asks what branches exist, wants to see repo activity, or asks about who is working on what.
---

# Git Repo Overview

Generate a progressive overview of a Git repository. Start with a high-level summary, then offer drill-down options.

**Exclude:** Project overview, how to run, tech stack, project structure, documentation links. Focus solely on Git data: branches, contributors, activity, recommendations.

## Phase 1: Gather Data

Run these commands in parallel:

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main"
git for-each-ref --sort=-committerdate --format='%(refname:short)|%(committerdate:relative)|%(committerdate:iso)|%(authorname)|%(subject)|%(upstream:track)' refs/heads/ refs/remotes/origin/
git branch --merged $(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
git log --all --oneline --since="2 weeks ago" --format='%h|%an|%ar|%D|%s'
git rev-list --count HEAD
git remote -v
```

For each branch, compute ahead/behind: `git rev-list --left-right --count DEFAULT...BRANCH`

## Phase 2: Present the Summary

### 1. Repository at a Glance

| Property | Value |
|----------|-------|
| Remote | origin URL |
| Default branch | main |
| Total commits | N |
| Local/Remote branches | N / N |
| Active (2 wk) | N branches |

### 2. Branch Table

Sort by most recent activity. Columns: Branch | Last activity | Author | Ahead | Behind | Status | Summary

**Status:** default | active (commits in 2 wk) | stale (>2 wk) | merged (candidate for deletion)

### 3. Branch Groups

Group by prefix (feature/, bugfix/, release/). Only include groups that exist.

### 4. Contributor Activity

Natural language summary per contributor: which branches, commit count, time period.

### 5. Recommendations

Actionable suggestions: cleanup merged branches, stale branches to rebase/close, diverged branches to merge.

## Phase 3: Offer Drill-Down

1. **Compare two branches** — hand off to `compare-branches` skill
2. **Recent commits** — `git log --oneline -20 <branch>`
3. **Files changed** — `git diff --stat <default>...<branch>`
4. **Contributor details** — `git shortlog -sn <default>..<branch>`
5. **Merge compatibility** — `git merge-tree $(git merge-base <default> <branch>) <default> <branch>`

## Notes

- Detect default branch dynamically (don't hardcode main/master)
- For >20 branches: show 15 most active, summarize the rest
- Triple-dot (`...`) for diff (merge base); double-dot (`..`) for log (reachable commits)
- Mark remote-only branches clearly
