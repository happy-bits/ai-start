Update the documentation in the `docs` folder according to the following:

## 1. What to update

- **Single file**: If the user types `/autodoc <filename>` only `docs/<filename>.md` is updated. Exit immediately without asking about the next document.
  - Example: `/autodoc abc` → updates only `docs/abc.md` and exits.
- **All documents**: If no filename is specified, all documents are updated (see point 2). Update one at a time and wait for confirmation between each.

## 2. Which documents

- **All documents** = all `.md` files in `docs/` except `_ai_instructions.md`.
- **Never make changes** to `docs/_ai_instructions.md`.

## 3. How each document is updated

Base the update on:
- Instructions in `docs/_ai_instructions.md`
- The "Purpose" heading in the document

If the document has an "Instructions for AI" section, it takes precedence over `_ai_instructions.md` in case of conflict.

## 4. Confirmation between documents

When multiple documents are to be updated:
- After each update, ask the question "Should I continue?"
- Empty response (just Enter), period (`.`), or short confirmations (e.g. `y`, `ok`) are interpreted as yes.
- Continue until all documents are updated or the user cancels.
