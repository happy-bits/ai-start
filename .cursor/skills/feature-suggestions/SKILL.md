---
name: feature-suggestions
description: Suggest new features for the project using a categorized feature matrix with impact prioritization. Use when the user asks for feature ideas, wants to improve the project, discusses roadmap, planning, backlog, or what to build next.
---

# Feature Suggestions

Suggest new features for the project using a categorized matrix. Output is a **table** with columns: Titel, Kategori, Impact, Beskrivning.

## When to Use

Apply this skill when the user:
- Asks for feature ideas, suggestions, or "what can we build?"
- Wants to improve the project or asks "what's missing?"
- Discusses roadmap, planning, backlog, or prioritization

## Categories

Use a mix of **general** and **domain-specific** categories:

| General | Domain (KeepWarm) |
|---------|-------------------|
| UX | Kontakter |
| Data | Säljare |
| Integration | Interaktioner |
| Säkerhet | Uppföljning |
| Prestanda | Rapport |

Assign each feature to one primary category.

## Impact

| Symbol | Nivå | Rekommendation |
|--------|------|----------------|
| 🟢 | High | Do first |
| 🟡 | Medium | Backlog |
| ⚪ | Low | Skip |

## Workflow

1. **Gather context** – Read `autodocs/oversikt.md` and optionally `autodocs/databas.md`, `autodocs/frontend.md`, `autodocs/backend.md` to understand current capabilities and gaps.
2. **Identify gaps** – Look for missing CRUD, incomplete flows, UX friction, data that could be exposed, integration opportunities.
3. **Generate suggestions** – Propose 3–7 features across categories.
4. **Prioritize** – Assign impact (high/medium/low) per feature.
5. **Output** – Present suggestions in a table (see format below).

## Output Format

Present suggestions in a **table** with columns: Titel, Kategori, Impact, Beskrivning.

Example:

| Titel | Kategori | Impact | Beskrivning |
|-------|----------|--------|-------------|
| Exportera kontakter till CSV | Kontakter | H | Låt säljare exportera sin kontaktlista för backup eller import till andra verktyg. |
| Sök i interaktioner | Interaktioner | M | Filtrera interaktioner på typ, datum eller fritext för snabbare genomgång. |
| Dashboard för följupp | Uppföljning | H | Översikt över kontakter som behöver följupp idag/denna vecka med snabb åtkomst. |

End with a brief prioritization note: which to do first (high impact) and which to backlog.

## Notes

- Keep suggestions concrete and implementable, not vague.
- Prefer features that fit the existing architecture (React, Hono, SQLite).
- If the user specifies a focus (e.g. "only UX"), limit suggestions to that area.
