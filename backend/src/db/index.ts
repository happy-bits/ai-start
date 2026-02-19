import { mkdirSync } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default to data/ directory in backend root
const DEFAULT_DB_PATH = path.join(__dirname, '../../data/keepwarm.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
try {
  mkdirSync(dbDir, { recursive: true });
} catch (_error) {
  // Directory might already exist, ignore
}

// Create SQLite database connection
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export the raw sqlite connection for direct operations (used in seed.ts and tests)
export const rawDb = sqlite;

// Path to migrations (resolved from this file's location)
const MIGRATIONS_FOLDER = path.join(__dirname, 'migrations');

// Run migrations
export function runMigrations() {
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

// Reset database (drop all tables and re-run migrations)
export function resetDatabase() {
  sqlite.exec(`
    DROP TABLE IF EXISTS interactions;
    DROP TABLE IF EXISTS contacts;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS __drizzle_migrations;
  `);
  runMigrations();
}

// Create a fresh database (e.g. :memory:) and run migrations. Used by tests.
export function createMigratedDatabase(dbPath: string = ':memory:') {
  const testSqlite = new Database(dbPath);
  testSqlite.pragma('foreign_keys = ON');
  const testDb = drizzle(testSqlite, { schema });
  migrate(testDb, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db: testDb, sqlite: testSqlite };
}
