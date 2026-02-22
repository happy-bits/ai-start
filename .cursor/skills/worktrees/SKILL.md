---
name: worktrees
description: Manage Git worktrees including listing, adding, removing, and cleaning. Use when the user asks to clean worktrees, remove worktrees, prune worktrees, or manage secondary worktrees.
---

# Git Worktrees

## Cleaning worktrees

When the user wants to **clean**, **remove**, or **prune** worktrees, run the cleanup script:

```bash
.cursor/skills/worktrees/remove-worktrees.sh
```

This removes Cursor-managed worktrees and prunes stale worktree references.
