---
name: autodocs
description: Generates automatic documentation for project parts. Use when the user asks for auto-documentation, wants to document the codebase, generate docs, or create autodocs.
---

# Automatic Documentation

## Workflow

### 1. Ensure autodocs folder exists

- Check if an `autodocs` folder exists in the project root (or the location the user specifies).
- If it does not exist, create it in the project root.
- **Exception**: If the user explicitly specifies a different location, use that instead.

### 2. Ask which parts to document

Ask the user which parts of the system they want to document. Examples:

- Specific modules or packages (e.g. "backend contacts API", "frontend ContactList")
- Areas of the codebase (e.g. "database schema", "API routes", "auth flow")
- High-level components (e.g. "the whole backend", "frontend pages")

Do not proceed to generate docs until the user has answered.

### 3. Generate or update documentation for each part

For each part the user specifies:

1. Create or update a markdown file in the `autodocs` folder.
2. Use a clear, kebab-case filename (e.g. `backend-contacts-api.md`, `database-schema.md`).
3. **Read and follow** `.cursor/skills/autodocs/instructions-for-documentation.md` when writing the content.
4. **If the document has a header "Instructions for AI"** then read and apply those rules as well.
5. **Never change "Instructions for AI"**—that section is readonly. Do not modify, remove, or overwrite it.
6. **Conflict resolution:** If rules in "Instructions for AI" conflict with `instructions-for-documentation.md`, follow "Instructions for AI".

**When updating existing docs:** Re-read the current file and the instructions, then regenerate the content to fix errors and keep it accurate. Do not blindly append.

### 4. Mermaid diagrams

Avoid slashes (`/`) in node labels—they cause parsing errors. Use e.g. `auth` or `auth: login, logout` instead of `/auth/login`.

## Summary Checklist

- [ ] `autodocs` folder exists (create if missing, unless user says otherwise)
- [ ] User has specified which parts to document
- [ ] Each part has its own markdown file in `autodocs/`
- [ ] Content follows instructions-for-documentation.md
- [ ] If document has "Instructions for AI", those rules are followed; conflicts resolved in favor of "Instructions for AI"
- [ ] "Instructions for AI" section is never modified (readonly)
- [ ] Mermaid labels contain no slashes
