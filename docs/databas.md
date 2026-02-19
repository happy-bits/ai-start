# Databasen – KeepWarm CRM

Denna dokumentation beskriver hur databasen fungerar i KeepWarm-projektet, med särskild fokus på migrationer.

## Översikt

Projektet använder **SQLite** som databas tillsammans med **Drizzle ORM**. Databasen lagras som en fil (`keepwarm.db`) i mappen `backend/data/`.

### Teknisk stack

- **Databas:** SQLite (via `better-sqlite3`)
- **ORM:** Drizzle ORM
- **Migrationer:** Drizzle Kit

---

## Databasschema

### Tabeller

| Tabell | Beskrivning |
|--------|-------------|
| `users` | Användare (säljare och admins) |
| `sessions` | Inloggningssessioner |
| `contacts` | Kontakter kopplade till säljare |
| `interactions` | Interaktioner (samtal, möten, e-post m.m.) kopplade till kontakter |

### Relationer

- **users → sessions:** En användare kan ha flera sessioner (cascade delete)
- **users → contacts:** En säljare äger sina kontakter (cascade delete)
- **contacts → interactions:** En kontakt har flera interaktioner (cascade delete)
- **users → interactions:** Interaktioner är kopplade till både kontakt och säljare (cascade delete)

### Schema-definition

Schemat definieras i `backend/src/db/schema.ts` med Drizzle ORM. Detta är den **enda källan** för tabellstrukturen – migrationer genereras utifrån denna fil.

---

## Migrationer

### Hur migrationer fungerar

1. **Schema-first:** Du ändrar `schema.ts` när du vill uppdatera databasen.
2. **Generera:** Drizzle Kit jämför schema med befintliga migrationer och skapar nya SQL-filer.
3. **Köra:** Migrationerna appliceras mot databasen (antingen vid start eller manuellt).

### Migrationsmappen

Alla migrationer finns i:

```
backend/src/db/migrations/
├── 0000_init.sql          # Initial migration
├── meta/
│   ├── _journal.json      # Journal över alla migrationer
│   └── 0000_snapshot.json # Snapshot av schema vid migration
```

### Migrationsflöde

```
schema.ts  →  drizzle-kit generate  →  migrations/*.sql  →  migrate()  →  databas
```

1. **Redigera** `backend/src/db/schema.ts`
2. **Generera** ny migration: `npm run db:generate` (i backend-mappen)
3. **Applicera** migrationen (se nedan)

### När körs migrationer?

Migrationer körs automatiskt **vid varje serverstart** i `backend/src/index.ts`:

```typescript
runMigrations();
```

Det innebär att alla nya migrationer appliceras när du startar backend-servern.

### Manuella kommandon

| Kommando | Beskrivning |
|----------|-------------|
| `npm run db:generate` | Genererar nya migrationer utifrån ändringar i `schema.ts` |
| `npm run db:migrate` | Kör migrationer via Drizzle Kit CLI |

**OBS:** I praktiken används `runMigrations()` vid start, så `db:migrate` behövs sällan. `db:generate` används när du har ändrat schemat.

### Skapa en ny migration

1. Ändra `backend/src/db/schema.ts` (lägg till tabell, kolumn, index, etc.)
2. Kör `cd backend && npm run db:generate`
3. Drizzle skapar en ny fil t.ex. `0001_add_something.sql` i migrations-mappen
4. Starta servern – migrationen körs automatiskt

### Drizzle migrations-tabell

Drizzle håller reda på vilka migrationer som körts i tabellen `__drizzle_migrations`. Den skapas automatiskt och bör inte ändras manuellt.

---

## Konfiguration

### Miljövariabler

| Variabel | Beskrivning | Standard |
|----------|-------------|----------|
| `DB_PATH` | Sökväg till databasfilen | `./data/keepwarm.db` (relativt backend) |

### Drizzle-konfiguration

`backend/drizzle.config.ts` anger:

- **dialect:** sqlite
- **schema:** `./src/db/schema.ts`
- **out:** `./src/db/migrations`
- **dbCredentials.url:** Samma som `DB_PATH`

### SQLite-inställningar

Vid anslutning sätts:

- `journal_mode = WAL` – bättre prestanda vid samtidiga läs/skriv
- `foreign_keys = ON` – aktiverar foreign key-constraints

---

## Databasåterställning

Funktionen `resetDatabase()` i `backend/src/db/index.ts`:

1. Droppar alla tabeller (i rätt ordning p.g.a. foreign keys)
2. Droppar `__drizzle_migrations`
3. Kör migrationer igen från början

Används för att återställa till ett rent schema (t.ex. i tester eller utveckling).

---

## Seed (testdata)

För att fylla databasen med testdata:

```bash
cd backend
SEED_DB=true npm run dev
```

eller:

```bash
npm run db:seed
```

Seed-logiken finns i `backend/src/db/seed.ts` och rensar befintlig data innan den infogar ny.

---

## Tester

Tester använder `createMigratedDatabase(':memory:')` för att skapa en temporär databas i minnet, köra migrationer, och returnera en fristående db-instans. Detta håller testerna isolerade från utvecklingsdatabasen.

---

## Sammanfattning

| Aspekt | Implementation |
|--------|----------------|
| Databas | SQLite (fil: `data/keepwarm.db`) |
| ORM | Drizzle ORM |
| Schema | `backend/src/db/schema.ts` |
| Migrationer | `backend/src/db/migrations/` |
| Generera migration | `npm run db:generate` |
| Köra migrationer | Automatiskt vid serverstart |
| Konfiguration | `backend/drizzle.config.ts` |
