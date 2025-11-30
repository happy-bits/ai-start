import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const DB_PATH = process.env.DB_PATH || 'keepwarm.db';

// Create SQLite database connection
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export the raw sqlite connection for direct operations
export const rawDb = sqlite;

// Initialize database tables
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'seller' CHECK(role IN ('admin', 'seller')),
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

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('call', 'meeting', 'email')),
      date TEXT NOT NULL,
      time TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_seller_id ON customers(seller_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_customer_id ON interactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_seller_id ON interactions(seller_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  `);
}

// Reset database (drop all tables and recreate)
export function resetDatabase() {
  sqlite.exec(`
    DROP TABLE IF EXISTS interactions;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS users;
  `);
  initializeDatabase();
}

// Close database connection
export function closeDatabase() {
  sqlite.close();
}

// Create a new database instance (useful for testing)
export function createDatabase(dbPath: string = ':memory:') {
  const testSqlite = new Database(dbPath);
  testSqlite.pragma('journal_mode = WAL');
  testSqlite.pragma('foreign_keys = ON');
  return {
    db: drizzle(testSqlite, { schema }),
    rawDb: testSqlite,
  };
}


