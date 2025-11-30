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
  db.delete(schema.contacts).run();
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
      name: 'Admin Användare',
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
      name: 'Maria Svensson',
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
      name: 'Lars Berg',
      role: ROLES.SELLER,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  console.log('Created users:', { adminUser, seller1, seller2 });

  // Seed contacts for seller1 (Maria)
  const contact1 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller1.id,
      name: 'Erik Andersson',
      email: 'erik.andersson@volvo.com',
      phone: '+46 70 123 45 67',
      company: 'Volvo AB',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  const contact2 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller1.id,
      name: 'Anna Larsson',
      email: 'anna.larsson@spotify.com',
      phone: '+46 72 234 56 78',
      company: 'Spotify',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  // Seed contacts for seller2 (Lars)
  const contact3 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller2.id,
      name: 'Johan Nilsson',
      email: 'johan.nilsson@ikea.se',
      phone: '+46 73 345 67 89',
      company: 'IKEA Sverige',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  console.log('Created contacts:', { contact1, contact2, contact3 });

  // Seed interactions for contact1
  db.insert(schema.interactions).values({
    contactId: contact1.id,
    sellerId: seller1.id,
    type: 'call',
    date: '2024-01-10',
    time: '09:30',
    notes: 'Inledande upptäcktsamtal. Diskuterade deras nuvarande CRM-behov.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  db.insert(schema.interactions).values({
    contactId: contact1.id,
    sellerId: seller1.id,
    type: 'email',
    date: '2024-01-12',
    time: '14:00',
    notes: 'Skickade produktbroschyr och prisinformation.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  db.insert(schema.interactions).values({
    contactId: contact1.id,
    sellerId: seller1.id,
    type: 'meeting',
    date: '2024-01-15',
    time: '10:00',
    notes: 'Demonstration med beslutsfattare.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  // Seed interactions for contact2
  db.insert(schema.interactions).values({
    contactId: contact2.id,
    sellerId: seller1.id,
    type: 'call',
    date: '2024-01-08',
    time: '11:00',
    notes: 'Kallt samtal konverterat till lead.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  // Seed interactions for contact3
  db.insert(schema.interactions).values({
    contactId: contact3.id,
    sellerId: seller2.id,
    type: 'meeting',
    date: '2024-01-14',
    time: '15:30',
    notes: 'Möte på plats vid deras huvudkontor.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  console.log('Database seeded successfully!');

  return {
    admin: adminUser,
    sellers: [seller1, seller2],
    contacts: [contact1, contact2, contact3],
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



