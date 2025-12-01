import { hash } from '@node-rs/argon2';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { ARGON_OPTIONS, ROLES } from '../constants.js';

// Deterministic seed data (no random values, fixed dates)
const SEED_DATE = '2024-01-15T10:00:00.000Z';

export async function seedDatabase(db: BetterSQLite3Database<typeof schema>) {
  // Clear existing data
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
      email: 'maria@sellmore.se',
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
      email: 'lars@hotmail.com',
      passwordHash: sellerPassword,
      name: 'Lars Berg',
      role: ROLES.SELLER,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();

  console.log('Created users:', { adminUser, seller1, seller2 });

  // Swedish names and companies for seed data
  const swedishNames = [
    'Erik Andersson', 'Anna Larsson', 'Johan Nilsson', 'Lisa Johansson', 'Lars Eriksson',
    'Emma Svensson', 'Anders Gustafsson', 'Sara Berg', 'Peter Lindqvist', 'Lisa Holm',
    'Mikael Persson', 'Jenny Lundberg', 'Daniel Olsson', 'Karin Nordström', 'Thomas Ek',
    'Helena Forsberg', 'Magnus Dahl', 'Camilla Sandberg', 'Fredrik Åberg', 'Malin Bergström',
    'Henrik Larsson', 'Sofia Andersson', 'Jonas Lind', 'Elin Johansson', 'Martin Berg',
    'Amanda Nilsson', 'Andreas Persson', 'Ida Gustafsson', 'Niklas Holm', 'Frida Ek'
  ];

  const companies = [
    'Volvo AB', 'Spotify', 'IKEA Sverige', 'H&M', 'Ericsson',
    'Atlas Copco', 'Sandvik', 'SKF', 'Electrolux', 'AstraZeneca',
    'Telia Company', 'Swedbank', 'SEB', 'Handelsbanken', 'Scania',
    'Saab', 'ABB', 'Alfa Laval', 'Assa Abloy', 'Atlas Copco',
    'Autoliv', 'Boliden', 'Getinge', 'Hexagon', 'Investor',
    'SAS', 'Swedish Match', 'Trelleborg', 'Vattenfall', 'Össur'
  ];

  // Seed 5 contacts for seller1 (Maria)
  const mariaContacts = [];
  for (let i = 0; i < 4; i++) {
    const contact = db
      .insert(schema.contacts)
      .values({
        sellerId: seller1.id,
        name: swedishNames[i],
        email: `${swedishNames[i].toLowerCase().replace(' ', '.')}@${companies[i].toLowerCase().replace(/\s+/g, '')}.se`,
        company: companies[i],
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      })
      .returning()
      .get();
    mariaContacts.push(contact);
  }

  // Seed contacts for seller2 (Lars)
  const larsContacts = [];
  
  const contact3 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller2.id,
      name: 'Johan Nilsson',
      email: 'johan.nilsson@ikea.se',
      company: 'IKEA Sverige',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();
  larsContacts.push(contact3);

  const contact4 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller2.id,
      name: 'Kristina Wallin',
      email: 'kristina.wallin@astrazeneca.com',
      company: 'AstraZeneca Sverige',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();
  larsContacts.push(contact4);

  const contact5 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller2.id,
      name: 'Robert Lindgren',
      email: 'robert.lindgren@teliacompany.se',
      company: 'Telia Company',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();
  larsContacts.push(contact5);

  console.log(`Created ${mariaContacts.length} contacts for Maria`);
  console.log(`Created ${larsContacts.length} contacts for Lars`);

  console.log('Database seeded successfully!');

  return {
    admin: adminUser,
    sellers: [seller1, seller2],
    contacts: [...mariaContacts, ...larsContacts],
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



