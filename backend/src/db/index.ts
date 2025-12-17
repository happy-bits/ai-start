import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { ROLES } from '../constants.js';

const DB_PATH = process.env.DB_PATH || 'keepwarm.db';

// Create SQLite database connection
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export the raw sqlite connection for direct operations (used in seed.ts and tests)
export const rawDb = sqlite;

// Initialize database tables
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '${ROLES.SELLER}' CHECK(role IN ('${ROLES.ADMIN}', '${ROLES.SELLER}')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      follow_up_date TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('call', 'meeting', 'email', 'video_call', 'note')),
      date TEXT NOT NULL,
      time TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_seller_id ON contacts(seller_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_seller_id ON interactions(seller_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  `);
}

// Reset database (drop all tables and recreate)
export function resetDatabase() {
  sqlite.exec(`
    DROP TABLE IF EXISTS interactions;
    DROP TABLE IF EXISTS contacts;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS users;
  `);
  initializeDatabase();
}



