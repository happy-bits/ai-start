/**
 * Migration script to remove the 'phone' column from the contacts table.
 * 
 * SQLite doesn't support DROP COLUMN directly, so we need to:
 * 1. Create a new table without the phone column
 * 2. Copy data from old table to new table
 * 3. Drop old table
 * 4. Rename new table to original name
 * 
 * Run this script with: npx tsx src/db/migrate-remove-phone.ts
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const DB_PATH = process.env.DB_PATH || 'keepwarm.db';

async function migrate() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('foreign_keys = OFF'); // Disable foreign keys temporarily

  try {
    console.log('Starting migration to remove phone column from contacts table...');

    // Check if phone column exists
    const tableInfo = sqlite.pragma('table_info(contacts)');
    const hasPhoneColumn = tableInfo.some((col: { name: string }) => col.name === 'phone');

    if (!hasPhoneColumn) {
      console.log('Phone column does not exist. Migration not needed.');
      return;
    }

    // Step 1: Create new table without phone column
    console.log('Creating new contacts table without phone column...');
    sqlite.exec(`
      CREATE TABLE contacts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        company TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Step 2: Copy data from old table to new table (excluding phone)
    console.log('Copying data to new table...');
    sqlite.exec(`
      INSERT INTO contacts_new (id, seller_id, name, email, company, created_at, updated_at)
      SELECT id, seller_id, name, email, company, created_at, updated_at
      FROM contacts;
    `);

    // Step 3: Drop old table
    console.log('Dropping old contacts table...');
    sqlite.exec('DROP TABLE contacts;');

    // Step 4: Rename new table to original name
    console.log('Renaming new table to contacts...');
    sqlite.exec('ALTER TABLE contacts_new RENAME TO contacts;');

    // Step 5: Recreate indexes
    console.log('Recreating indexes...');
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_contacts_seller_id ON contacts(seller_id);');

    // Re-enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    sqlite.pragma('foreign_keys = ON');
    throw error;
  } finally {
    sqlite.close();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
}

export { migrate };

