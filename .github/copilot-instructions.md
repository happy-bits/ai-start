# KeepWarm CRM - Copilot Instructions

## Project Overview
A full-stack CRM for managing sales contacts and interactions. Monorepo with separate `backend/` (REST API) and `frontend/` (React SPA) directories.

## Architecture

### Backend (`backend/`)
- **Framework**: Hono (lightweight Express-like) with TypeScript
- **Database**: SQLite via Drizzle ORM + better-sqlite3
- **Auth**: Bearer token sessions stored in DB, Argon2 password hashing
- **Validation**: Zod schemas for request validation (`@hono/zod-validator`)

**Key patterns:**
- Routes use factory functions: `createContactRoutes(db)` returns Hono router
- Helper `withEntityAccess()` in [routes/helpers.ts](backend/src/routes/helpers.ts) handles ID parsing, entity lookup, and seller access check in one call
- Sellers only see their own data; admins see all (role-based filtering in route handlers)
- Soft delete for contacts via `deletedAt` field; wastebin route at `/contacts/wastebin`

### Frontend (`frontend/`)
- **Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **State**: TanStack Query for server state, Context for auth
- **Routing**: React Router v7

**Key patterns:**
- API client singleton in [api/client.ts](frontend/src/api/client.ts) handles auth token and error formatting
- Inline editing components (`InlineEditable*`) in [components/ui/](frontend/src/components/ui/) use `useInlineEdit` hook
- Shared types defined in [api/types.ts](frontend/src/api/types.ts)
- `ROLES` constant must stay in sync between frontend and backend `constants.ts`

## Development Commands

```bash
# Backend (from backend/)
SEED_DB=true npm run dev   # First run with seed data
npm run dev                # Subsequent runs
npm test                   # Watch mode tests

# Frontend (from frontend/)
npm run dev                # Vite dev server
npm test                   # Unit tests (vitest)
npm run test:e2e           # Playwright headless
npm run test:e2e:ui        # Playwright visual debugger
npm run test:e2e:trace     # With network/screenshot traces
```

## Testing Conventions

### Backend Tests
- In-memory SQLite database created fresh per test via `createTestDatabase()`
- Use helpers: `get()`, `post()`, `put()`, `del()` and assertion helpers like `expectOk()`, `expectForbidden()`
- See [tests/setup.ts](backend/tests/setup.ts) for test context setup pattern

### E2E Tests (Playwright)
- **Always use semantic selectors** (see [.cursor/rules/e2e-selectors.mdc](.cursor/rules/e2e-selectors.mdc))
- ✅ `page.getByRole('button', { name: 'Sign in' })`
- ✅ `page.getByLabel('Email')`
- ❌ Never use `page.locator('input[type="text"]')` or raw HTML selectors
- Login page has "Reset database" and "Quick login" buttons for test setup

## Code Patterns

### Adding a New Entity
1. Add table in [db/schema.ts](backend/src/db/schema.ts) with Drizzle schema
2. Create Zod schemas and route file in `backend/src/routes/`
3. Mount routes in [app.ts](backend/src/app.ts) under `protectedApp`
4. Add frontend types in [api/types.ts](frontend/src/api/types.ts)
5. Create API functions in `frontend/src/api/`

### Error Handling
- Backend: Use `ERROR_MESSAGES` constants from [constants.ts](backend/src/constants.ts)
- Frontend: API client extracts error messages from Zod validation or string responses

### Date Format
- All dates stored and transferred as `YYYY-MM-DD` strings (validated by `DATE_FORMAT_REGEX`)

## File Organization
- `backend/sql/` - Reference SQL files (schema documentation)
- `backend/doc/` - User stories and flow documentation
- `frontend/src/components/ui/` - Reusable UI primitives
- `frontend/src/pages/` - Route-level page components
