---
name: autodocs
description: Sets up and updates automatic documentation in the project. Use when the user wants to set up or update automatic documentation.
---

# Instruction precedence

When updating or creating a document in autodocs:

1. Read `instructions-for-documentation.md` (same folder as this skill) for global rules.
2. If the **target document** (e.g. abc.md) has a heading "Instructions for AI", those instructions **override** conflicting rules in instructions-for-documentation.md. 

---

# Set up automatic documentation

### 1. Create or verify the autodocs folder

- Check if the `autodocs` folder exists (typically at project root)
- If it **does not** exist, create it there
- **Exception**: If the user specifies a different location (e.g. `docs/autodocs`), use that path instead

### 2. Ask which parts should be documented

Ask which parts to document. The user is not limited to the suggestions below – they may propose their own areas:

- **Frontend** – UI, components, pages, state
- **Backend** – APIs, services, logic
- **Database** – schema, models, relationships
- **Overview** – architecture, flows, system overview

One or more parts may be selected.

### 3. Create a markdown file per selected part

Before creating documentation:

Read `instructions-for-documentation.md` (same folder as this skill). If it is missing, show an error and abort. If the document already exists and has a heading "Instructions for AI", apply those instructions (see Instruction precedence above).

Update one document at a time, then stop, and ask "Should I continue?". Treat empty, `.`, or brief confirmations (`y`, `ok`) as yes.

---

# Update existing documentation

When the user wants to update one, several, or all documents in autodocs:

1. **Identify which documents** – The user may specify one (e.g. "update frontend.md"), several or all ("update autodoc documents").
2. **Read instructions** – Read `instructions-for-documentation.md` (same folder as this skill). If missing, show error and abort. For each target document, check for "Instructions for AI" and apply those (see Instruction precedence above).
3. **Update each document** – For each selected document:
   - If the document exists: critically review it first. Look for errors, inconsistencies, or outdated information before updating.
   - Apply the same rules as for creation 
   - Write the updated content.
   - Don't update the text under "Instructions for AI", this text is readonly.
4. **Continue prompt** – After each document, ask "Should I continue?". Treat empty, `.`, or brief confirmations (`y`, `ok`) as yes.
