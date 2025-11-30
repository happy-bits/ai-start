import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { hash } from '@node-rs/argon2';
import * as schema from '../src/db/schema.js';
import { createApp } from '../src/app.js';
import { createSession } from '../src/middleware/auth.js';

export type TestContext = {
  db: ReturnType<typeof drizzle<typeof schema>>;
  rawDb: Database.Database;
  app: ReturnType<typeof createApp>;
  adminToken: string;
  sellerToken: string;
  seller2Token: string;
  adminId: number;
  sellerId: number;
  seller2Id: number;
  customerId: number;
  customer2Id: number;
  interactionId: number;
};

// Create a fresh test database
export function createTestDatabase() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  // Create tables
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'seller' CHECK(role IN ('admin', 'seller')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE customers (
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

    CREATE TABLE interactions (
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

    CREATE INDEX idx_customers_seller_id ON customers(seller_id);
    CREATE INDEX idx_interactions_customer_id ON interactions(customer_id);
    CREATE INDEX idx_interactions_seller_id ON interactions(seller_id);
    CREATE INDEX idx_sessions_token ON sessions(token);
  `);

  const db = drizzle(sqlite, { schema });
  return { db, rawDb: sqlite };
}

// Seed test data with deterministic values
export async function seedTestData(db: ReturnType<typeof drizzle<typeof schema>>): Promise<{
  adminId: number;
  sellerId: number;
  seller2Id: number;
  customerId: number;
  customer2Id: number;
  interactionId: number;
  adminToken: string;
  sellerToken: string;
  seller2Token: string;
}> {
  const now = '2024-01-15T10:00:00.000Z';

  // Create password hash
  const passwordHash = await hash('password123', {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  // Create admin
  const admin = db
    .insert(schema.users)
    .values({
      email: 'admin@test.com',
      passwordHash,
      name: 'Test Admin',
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  // Create sellers
  const seller = db
    .insert(schema.users)
    .values({
      email: 'seller@test.com',
      passwordHash,
      name: 'Test Seller',
      role: 'seller',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  const seller2 = db
    .insert(schema.users)
    .values({
      email: 'seller2@test.com',
      passwordHash,
      name: 'Test Seller 2',
      role: 'seller',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  // Create customers
  const customer = db
    .insert(schema.customers)
    .values({
      sellerId: seller.id,
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+1-555-0100',
      company: 'Test Corp',
      notes: 'Test notes',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  const customer2 = db
    .insert(schema.customers)
    .values({
      sellerId: seller2.id,
      name: 'Other Customer',
      email: 'other@test.com',
      phone: '+1-555-0200',
      company: 'Other Corp',
      notes: 'Other notes',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  // Create interaction
  const interaction = db
    .insert(schema.interactions)
    .values({
      customerId: customer.id,
      sellerId: seller.id,
      type: 'call',
      date: '2024-01-10',
      time: '10:00',
      notes: 'Test call',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  // Create sessions
  const adminToken = createSession(db, admin.id);
  const sellerToken = createSession(db, seller.id);
  const seller2Token = createSession(db, seller2.id);

  return {
    adminId: admin.id,
    sellerId: seller.id,
    seller2Id: seller2.id,
    customerId: customer.id,
    customer2Id: customer2.id,
    interactionId: interaction.id,
    adminToken,
    sellerToken,
    seller2Token,
  };
}

// Setup helper for tests
export async function setupTest(): Promise<TestContext> {
  const { db, rawDb } = createTestDatabase();
  const seedData = await seedTestData(db);
  const app = createApp(db, { enableLogging: false });

  return {
    db,
    rawDb,
    app,
    ...seedData,
  };
}

// Make authenticated request helper
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}


