---
name: feature-suggestions
description: Suggests new features for KeepWarm CRM using persona and workflow analysis. Use when the user asks for feature ideas, improvements, what to build next, or how to enhance the product.
---

# Feature Suggestions

## Approach

Suggest features by inferring personas from the codebase, mapping their workflows, and identifying friction points. Output a narrative paragraph per persona.

## Workflow

### 1. Infer personas from the codebase

Read these files to identify roles and capabilities:

- `backend/src/db/schema.ts` – users table, role enum (admin/seller)
- `backend/src/app.ts` – route structure
- `frontend/src/config/navigation.tsx` – nav items, admin-only sections

Extract: who are the users, what can they access, what data do they own.

### 2. Map current workflows

For each persona, trace what they can do today:

- Routes and API endpoints they use
- Main UI flows (e.g. contacts list, follow-up dates, wastebin)
- Data they create, read, update, delete

### 3. Identify friction and gaps

**Current workflows**: Where is the flow clunky, slow, or repetitive? What small improvements would help?

**New workflows**: What would this persona want to do that they cannot do today? What do similar CRMs typically offer?

### 4. Output format

Write **one narrative paragraph per persona**. Each paragraph should:

- Open with the persona and their main goal
- Describe 1–2 pain points in current workflows
- Suggest 1–2 improvements to existing flows
- Suggest 1–2 new workflows or capabilities
- Be concrete and actionable (avoid vague "better UX")

### 5. Optional summary

If multiple personas, add a short closing paragraph with 2–3 cross-cutting features that benefit more than one persona.

## Example output structure

```
## [Persona name]

[Persona] manages [their domain]. Today they [current workflow]. A friction point is [specific pain]. Improving [X] would help. They would also benefit from [new capability], which would enable [outcome].

## [Next persona]

...

## Cross-cutting

[Feature] would help both [persona A] and [persona B] by [benefit].
```

## What to read

| File | Purpose |
|------|---------|
| `backend/src/db/schema.ts` | Users, roles, entities |
| `backend/src/app.ts` | Routes, auth boundaries |
| `frontend/src/config/navigation.tsx` | UI structure, admin vs seller |
| `frontend/src/pages/contacts/ContactList.tsx` | Main seller workflow |
| `frontend/src/config/interactions.tsx` | Interaction types |

Keep the analysis grounded in what exists. Do not suggest features that are already implemented.
