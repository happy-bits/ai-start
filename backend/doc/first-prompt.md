Create a REST API backend for KeepWarm CRM according to user stories **userstories.md**

Tech stack:
- TypeScript (Type safety, better developer experience, catches errors at compile time)
- Hono (Modern, fast, lightweight web framework. Simpler than Express)
- Drizzle ORM (Type-safe SQL builder with excellent SQLite support. No migrations required for simple setup)
- better-sqlite3 (Synchronous, fast SQLite driver for Node.js)
- Vitest (Fast testing framework that works excellently with TypeScript)

Tests:
- Integration tests against real SQLite database (in-memory or temp file)
