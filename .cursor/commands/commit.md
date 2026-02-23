Create a commit message based on what has changed.
- If any files are staged, use only staged changes; otherwise use all changes.
- Do not run git commit (the user will do that).

Output exactly ONE commit title in a box so I can copy it. Use Conventional Commits format:
<type>: <Subject>

Allowed type:
feat | fix | docs | refactor | test | chore | build | ci | perf

Subject rules:
- English
- Imperative mood (e.g. Add/Fix/Remove/Update)
- First letter capitalized
- No trailing period
- Max 72 characters

Examples:
fix: Display dates in Stockholm timezone
feat: Add passwordless login
refactor: Remove legacy session cookie parsing

After the title, output exactly ONE of:
✅ Suitable as a commit
OR
⚠️ Recommend splitting into multiple commits
- Give a short motivation
- Suggest 2–5 commit titles (in order) that would split the changes well