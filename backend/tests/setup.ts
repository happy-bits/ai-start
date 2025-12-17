import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { expect } from 'vitest';
import * as schema from '../src/db/schema.js';
import { createApp } from '../src/app.js';
import { createSession, hashPassword } from '../src/middleware/auth.js';
import { ROLES } from '../src/constants.js';

export type TestContext = {
  db: ReturnType<typeof drizzle<typeof schema>>;
  app: ReturnType<typeof createApp>;
  adminToken: string;
  sellerToken: string;
  seller2Token: string;
  adminId: number;
  sellerId: number;
  seller2Id: number;
  contactId: number;
  contact2Id: number;
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
      role TEXT NOT NULL DEFAULT '${ROLES.SELLER}' CHECK(role IN ('${ROLES.ADMIN}', '${ROLES.SELLER}')),
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

    CREATE TABLE contacts (
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

    CREATE TABLE interactions (
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

    CREATE INDEX idx_contacts_seller_id ON contacts(seller_id);
    CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
    CREATE INDEX idx_interactions_seller_id ON interactions(seller_id);
    CREATE INDEX idx_sessions_token ON sessions(token);
  `);

  const db = drizzle(sqlite, { schema });
  return { db };
}

// Seed test data with deterministic values
export async function seedTestData(db: ReturnType<typeof drizzle<typeof schema>>): Promise<{
  adminId: number;
  sellerId: number;
  seller2Id: number;
  contactId: number;
  contact2Id: number;
  interactionId: number;
  adminToken: string;
  sellerToken: string;
  seller2Token: string;
}> {
  const now = '2024-01-15T10:00:00.000Z';
  const passwordHash = await hashPassword('password123');

  // Create admin
  const admin = db
    .insert(schema.users)
    .values({
      email: 'admin@test.com',
      passwordHash,
      name: 'Test Admin',
      role: ROLES.ADMIN,
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
      role: ROLES.SELLER,
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
      role: ROLES.SELLER,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  // Create contacts
  const contact = db
    .insert(schema.contacts)
    .values({
      sellerId: seller.id,
      name: 'Test Contact',
      email: 'contact@test.com',
      phone: '+1-555-0100',
      company: 'Test Corp',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  const contact2 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller2.id,
      name: 'Other Contact',
      email: 'other@test.com',
      phone: '+1-555-0200',
      company: 'Other Corp',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  // Create interaction
  const interaction = db
    .insert(schema.interactions)
    .values({
      contactId: contact.id,
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
    contactId: contact.id,
    contact2Id: contact2.id,
    interactionId: interaction.id,
    adminToken,
    sellerToken,
    seller2Token,
  };
}

// Setup helper for tests
export async function setupTest(): Promise<TestContext> {
  const { db } = createTestDatabase();
  const seedData = await seedTestData(db);
  const app = createApp(db, { enableLogging: false });

  return {
    db,
    app,
    ...seedData,
  };
}

// Make authenticated request helper
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Request helpers for cleaner tests
export function get(app: TestContext['app'], url: string, token: string) {
  return app.request(url, { headers: authHeader(token) });
}

export function post(app: TestContext['app'], url: string, token: string | null, body: object) {
  return app.request(url, {
    method: 'POST',
    headers: { ...(token ? authHeader(token) : {}), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function put(app: TestContext['app'], url: string, token: string, body: object) {
  return app.request(url, {
    method: 'PUT',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function del(app: TestContext['app'], url: string, token: string) {
  return app.request(url, { method: 'DELETE', headers: authHeader(token) });
}

// Test assertion helpers for cleaner tests
export async function expectJson<T = unknown>(res: Response, status: number): Promise<T> {
  expect(res.status).toBe(status);
  return res.json() as Promise<T>;
}

export async function expectNotFound(res: Response) {
  expect(res.status).toBe(404);
}

export async function expectForbidden(res: Response) {
  expect(res.status).toBe(403);
}

export async function expectUnauthorized(res: Response) {
  expect(res.status).toBe(401);
}

export async function expectBadRequest(res: Response) {
  expect(res.status).toBe(400);
}

export async function expectCreated<T = unknown>(res: Response): Promise<T> {
  return expectJson<T>(res, 201);
}

export async function expectOk<T = unknown>(res: Response): Promise<T> {
  return expectJson<T>(res, 200);
}

