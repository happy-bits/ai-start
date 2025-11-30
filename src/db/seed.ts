import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { ARGON_OPTIONS, ROLES } from '../constants.js';

// Deterministic seed data (no random values, fixed dates)
const SEED_DATE = '2024-01-15T10:00:00.000Z';

export async function seedDatabase(db: BetterSQLite3Database<typeof schema>) {
  // Clear existing data
  db.delete(schema.interactions).run();
  db.delete(schema.customers).run();
  db.delete(schema.sessions).run();
  db.delete(schema.users).run();

  // Create password hashes (deterministic with fixed options)
  const adminPassword = await hash('admin123', ARGON_OPTIONS);
  const sellerPassword = await hash('seller123', ARGON_OPTIONS);

  // Seed users
  const adminUser = db
    .insert(schema.users)
    .values({
      email: 'admin@keepwarm.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: ROLES.ADMIN,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  const seller1 = db
    .insert(schema.users)
    .values({
      email: 'alice@keepwarm.com',
      passwordHash: sellerPassword,
      name: 'Alice Johnson',
      role: ROLES.SELLER,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  const seller2 = db
    .insert(schema.users)
    .values({
      email: 'bob@keepwarm.com',
      passwordHash: sellerPassword,
      name: 'Bob Smith',
      role: ROLES.SELLER,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  console.log('Created users:', { adminUser, seller1, seller2 });

  // Seed customers for seller1 (Alice)
  const customer1 = db
    .insert(schema.customers)
    .values({
      sellerId: seller1.id,
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1-555-0101',
      company: 'Acme Corp',
      notes: 'Large enterprise client, interested in premium plans',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  const customer2 = db
    .insert(schema.customers)
    .values({
      sellerId: seller1.id,
      name: 'Tech Startup Inc',
      email: 'hello@techstartup.io',
      phone: '+1-555-0102',
      company: 'Tech Startup',
      notes: 'Growing startup, needs scalable solution',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  // Seed customers for seller2 (Bob)
  const customer3 = db
    .insert(schema.customers)
    .values({
      sellerId: seller2.id,
      name: 'Global Industries',
      email: 'sales@globalind.com',
      phone: '+1-555-0201',
      company: 'Global Industries Ltd',
      notes: 'International client, multiple locations',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  console.log('Created customers:', { customer1, customer2, customer3 });

  // Seed interactions for customer1
  db.insert(schema.interactions).values({
    customerId: customer1.id,
    sellerId: seller1.id,
    type: 'call',
    date: '2024-01-10',
    time: '09:30',
    notes: 'Initial discovery call. Discussed their current CRM needs.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  db.insert(schema.interactions).values({
    customerId: customer1.id,
    sellerId: seller1.id,
    type: 'email',
    date: '2024-01-12',
    time: '14:00',
    notes: 'Sent product brochure and pricing information.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  db.insert(schema.interactions).values({
    customerId: customer1.id,
    sellerId: seller1.id,
    type: 'meeting',
    date: '2024-01-15',
    time: '10:00',
    notes: 'Demo presentation with decision makers.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  // Seed interactions for customer2
  db.insert(schema.interactions).values({
    customerId: customer2.id,
    sellerId: seller1.id,
    type: 'call',
    date: '2024-01-08',
    time: '11:00',
    notes: 'Cold call converted to lead.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  // Seed interactions for customer3
  db.insert(schema.interactions).values({
    customerId: customer3.id,
    sellerId: seller2.id,
    type: 'meeting',
    date: '2024-01-14',
    time: '15:30',
    notes: 'On-site meeting at their headquarters.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  console.log('Database seeded successfully!');

  return {
    admin: adminUser,
    sellers: [seller1, seller2],
    customers: [customer1, customer2, customer3],
  };
}

// Run seed if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const { db, rawDb } = await import('./index.js');
  const { initializeDatabase } = await import('./index.js');
  initializeDatabase();
  await seedDatabase(db);
  rawDb.close();
}



