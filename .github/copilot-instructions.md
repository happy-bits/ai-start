# Copilot instructions (keepwarm)

## Repo shape + data flow
- This is a **monorepo** with `backend/` (REST API) and `frontend/` (React app).
- Backend is **Hono** + **Drizzle ORM** + **better-sqlite3**. Server entry is `backend/src/index.ts`, app wiring is `backend/src/app.ts`.
- Frontend is **Vite + React Router + TanStack Query**. App wiring: `frontend/src/main.tsx` + routes in `frontend/src/App.tsx`.
- Auth is **Bearer token** sessions:
  - Backend middleware: `backend/src/middleware/auth.ts` reads `Authorization: Bearer <token>` and loads the user from `sessions` + `users` tables.
  - Frontend stores token in `localStorage` via `frontend/src/api/client.ts` and validates it on boot in `frontend/src/context/AuthContext.tsx`.

## Backend conventions (Hono + Drizzle)
- Routes are mounted under `/api/*` in `backend/src/app.ts`; `/auth/*` is public.
- Prefer the shared route helpers in `backend/src/routes/helpers.ts`:
  - `parseIdParam(c, 'id', 'Contact')` for id validation
  - `withEntityAccess(c, db, schema.contacts, 'Contact')` for (404 + seller access) checks
  - `buildUpdateValues(updates, ['name', ...])` to keep partial updates consistent and always bump `updatedAt`.
- Role rules: sellers only see their own data; admins see all. Example pattern in `backend/src/routes/contacts.ts`.
- Contacts use **soft delete** via `contacts.deleted_at` with a dedicated wastebin endpoint:
  - list: `GET /api/contacts` (excludes deleted)
  - wastebin: `GET /api/contacts/wastebin` (deleted only)
  - restore: `POST /api/contacts/:id/restore`
  - permanent delete: `DELETE /api/contacts/:id/permanent`

## Database model + seeding
- SQLite schema lives in two places:
  - runtime table creation: `backend/src/db/index.ts` (`initializeDatabase()` uses raw SQL)
  - Drizzle model definitions: `backend/src/db/schema.ts` (match column names!)
- Dev seeding:
  - `SEED_DB=true` on `npm run dev` resets + seeds in `backend/src/index.ts`.
  - There is also a dev-only endpoint: `POST /api/dev/reset` (admin-only, blocked in production) in `backend/src/app.ts`.

## Frontend conventions
- API calls go through `frontend/src/api/client.ts` so the auth header and error-shape handling stay consistent.
- App routing uses guards:
  - `ProtectedRoute` blocks unauthenticated users
  - `AdminRoute` blocks non-admins
  (see `frontend/src/App.tsx`).

## Tests + selector rules
- Backend tests: `backend/tests/*.test.ts` are Vitest; helpers in `backend/tests/setup.ts`.
- Frontend unit tests use Vitest (`frontend/src/utils/__tests__/*` etc.).
- E2E uses Playwright (`frontend/e2e/*.spec.ts`). Follow selector rules in `.cursor/rules/e2e-selectors.mdc`:
  - prefer `getByRole()` / `getByLabel()`; avoid raw element selectors (`page.locator('button')`, `input[type=...]`, etc.)
  - if needed, **change the UI** to add `aria-label` / roles rather than weakening the test.

## Common workflows (repo-specific)
- Backend:
  - dev server: `npm run dev` (watch via `tsx`) from `backend/`
  - seed+dev: `SEED_DB=true npm run dev`
  - tests: `npm test` (watch) or `npm run test:run`
- Frontend:
  - dev server: `npm run dev` from `frontend/`
  - e2e modes: `npm run test:e2e` / `test:e2e:ui` / `test:e2e:trace` etc. (see root `readme.md`).
