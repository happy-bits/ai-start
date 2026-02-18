---
name: compare-branches
description: Compare two Git branches showing commit differences, file changes, and divergence stats. Use when the user asks to compare branches, see what changed between branches, check branch differences, or review branch divergence.
---

# Compare Git Branches

## Workflow

1. **Identify branches to compare**

   Ask the user which two branches to compare if not specified. Use the format:
   - **base**: the reference branch (e.g. `main`)
   - **head**: the branch with changes (e.g. `feature/login`)

   If only one branch is given, ask which is the base.

   Run `git branch -a` to list available branches if the user is unsure.

2. **Gather comparison data**

   Run these commands in parallel to collect stats:

   ```bash
   # Commits on head not in base
   git log --oneline <base>..<head>

   # Commits on base not in head
   git log --oneline <head>..<base>

   # Files changed between the branches
   git diff --stat <base>...<head>

   # Merge base (where branches diverged)
   git merge-base <base> <head>
   ```

3. **Present a concise summary**

   Format the output as:

   ```
   ## Branch Comparison: <base> vs <head>

   | Metric | Value |
   |--------|-------|
   | Commits ahead (head) | N |
   | Commits behind (base) | N |
   | Files changed | N |
   | Insertions | +N |
   | Deletions | -N |
   | Diverged at | <short SHA> (<date>) |

   ### Changed files
   - path/to/file1.ts (+X, -Y)
   - path/to/file2.ts (+X, -Y)
   ```

4. **Offer to drill into details**

   After the summary, offer:
   - View the full commit list for either direction
   - Show the diff for a specific file
   - Check if the branches can merge cleanly (`git merge-tree` or `git merge --no-commit --no-ff` in a dry-run sense)

## Notes

- Use triple-dot (`...`) for `git diff` to compare against the merge base, not the branch tip. This shows only what head introduced.
- Use double-dot (`..`) for `git log` to list commits reachable from one side but not the other.
- If a branch name is ambiguous (exists locally and on remote), prefer the local branch unless the user specifies otherwise.
