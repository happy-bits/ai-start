import { hash } from '@node-rs/argon2';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { ARGON_OPTIONS, ROLES } from '../constants.js';
import * as schema from './schema.js';

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

  // Helper function to generate deterministic number of interactions (0-5) based on index
  function getInteractionCount(index: number): number {
    // Deterministic pattern: cycles through 0-5 based on index
    const pattern = [
      3, 1, 5, 0, 2, 4, 3, 2, 1, 5, 0, 4, 3, 2, 1, 0, 5, 4, 3, 2, 1, 0, 4, 3, 2, 5, 1, 0, 4, 3,
    ];
    return pattern[index % pattern.length];
  }

  // Helper function to generate follow-up date between 2025-11-20 and 2026-01-18
  function getFollowUpDate(index: number): string {
    const startDate = new Date('2025-11-20');
    const endDate = new Date('2026-01-18');
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToAdd = (index * 7) % (daysDiff + 1); // Distribute evenly across range
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  }

  // Swedish names and companies for seed data
  const swedishNames = [
    'Erik Andersson',
    'Anna Larsson',
    'Johan Nilsson',
    'Maria Johansson',
    'Lars Eriksson',
    'Emma Svensson',
    'Anders Gustafsson',
    'Sara Berg',
    'Peter Lindqvist',
    'Lisa Holm',
    'Mikael Persson',
    'Jenny Lundberg',
    'Daniel Olsson',
    'Karin Nordström',
    'Thomas Ek',
    'Helena Forsberg',
    'Magnus Dahl',
    'Camilla Sandberg',
    'Fredrik Åberg',
    'Malin Bergström',
    'Henrik Larsson',
    'Sofia Andersson',
    'Jonas Lind',
    'Elin Johansson',
    'Martin Berg',
    'Amanda Nilsson',
    'Andreas Persson',
    'Ida Gustafsson',
    'Niklas Holm',
    'Frida Ek',
  ];

  const companies = [
    'Volvo AB',
    'Spotify',
    'IKEA Sverige',
    'H&M',
    'Ericsson',
    'Atlas Copco',
    'Sandvik',
    'SKF',
    'Electrolux',
    'AstraZeneca',
    'Telia Company',
    'Swedbank',
    'SEB',
    'Handelsbanken',
    'Scania',
    'Saab',
    'ABB',
    'Alfa Laval',
    'Assa Abloy',
    'Atlas Copco',
    'Autoliv',
    'Boliden',
    'Getinge',
    'Hexagon',
    'Investor',
    'SAS',
    'Swedish Match',
    'Trelleborg',
    'Vattenfall',
    'Össur',
  ];

  // Use only the first 10 companies for Maria's contacts
  const mariaCompanies = companies.slice(0, 10);

  // Variable distribution: contacts per company
  // Pattern: [5, 4, 6, 3, 2, 5, 1, 2, 1, 1] = 30 contacts total
  const contactsPerCompany = [5, 4, 6, 3, 2, 5, 1, 2, 1, 1];

  // Helper function to get company index for a contact index
  function getCompanyIndex(contactIndex: number): number {
    let cumulative = 0;
    for (let i = 0; i < contactsPerCompany.length; i++) {
      cumulative += contactsPerCompany[i];
      if (contactIndex < cumulative) {
        return i;
      }
    }
    return contactsPerCompany.length - 1;
  }

  // Helper function to get contact number within company (0-based)
  function getContactNumberInCompany(contactIndex: number): number {
    let cumulative = 0;
    for (let i = 0; i < contactsPerCompany.length; i++) {
      if (contactIndex < cumulative + contactsPerCompany[i]) {
        return contactIndex - cumulative;
      }
      cumulative += contactsPerCompany[i];
    }
    return 0;
  }

  // Seed 30 contacts for seller1 (Maria)
  const mariaContacts = [];
  for (let i = 0; i < 30; i++) {
    const companyIndex = getCompanyIndex(i);
    const company = mariaCompanies[companyIndex];
    const contactNumber = getContactNumberInCompany(i);
    const companyDomain = company.toLowerCase().replace(/\s+/g, '');

    // Generate email with company domain, adding number suffix if multiple contacts from same company
    const emailBase = swedishNames[i].toLowerCase().replace(' ', '.');
    const email =
      contactNumber > 0
        ? `${emailBase}${contactNumber + 1}@${companyDomain}.se`
        : `${emailBase}@${companyDomain}.se`;

    const contact = db
      .insert(schema.contacts)
      .values({
        sellerId: seller1.id,
        name: swedishNames[i],
        email: email,
        phone: `+46 70 ${String(123 + i).padStart(3, '0')} ${String(45 + i).padStart(2, '0')} ${String(67 + i).padStart(2, '0')}`,
        company: company,
        followUpDate: getFollowUpDate(i),
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      })
      .returning()
      .get();
    mariaContacts.push(contact);
  }

  // Seed interactions for Maria's contacts (0-5 per contact)
  const interactionTypes: Array<'call' | 'meeting' | 'email' | 'video_call' | 'note'> = [
    'call',
    'meeting',
    'email',
    'video_call',
    'note',
  ];
  const interactionNotes = [
    'Inledande upptäcktsamtal. Diskuterade deras nuvarande CRM-behov.',
    'Skickade produktbroschyr och prisinformation.',
    'Demonstration med beslutsfattare.',
    'Kallt samtal konverterat till lead.',
    'Möte på plats vid deras huvudkontor.',
    'Uppföljning efter initialt möte.',
    'Diskuterade specifika integrationsbehov.',
    'Skickade offert och kontrakt.',
    'Telefonuppföljning om deras intresse.',
    'Planerade nästa steg i processen.',
    'Svarade på tekniska frågor.',
    'Bokade demo med tekniskt team.',
    'Diskuterade prissättning och licenser.',
    'Uppföljning på skickad information.',
    'Kvalificerade lead och behov.',
  ];

  for (let i = 0; i < mariaContacts.length; i++) {
    const contact = mariaContacts[i];
    const interactionCount = getInteractionCount(i);

    // Generate interactions with dates before the follow-up date
    const followUpDateStr = contact.followUpDate;
    if (!followUpDateStr) continue;
    const followUpDate = new Date(followUpDateStr);

    for (let j = 0; j < interactionCount; j++) {
      // Distribute interactions over time before follow-up date
      const daysBefore = (interactionCount - j) * 7 + j * 3; // Spread out interactions
      const interactionDate = new Date(followUpDate);
      interactionDate.setDate(interactionDate.getDate() - daysBefore);

      // Ensure date is within reasonable range (not before 2025-11-01)
      const minDate = new Date('2025-11-01');
      if (interactionDate < minDate) {
        interactionDate.setTime(minDate.getTime() + j * 86400000); // Add days if needed
      }

      const hour = 9 + (j % 8); // Distribute times throughout the day
      const minute = (j * 15) % 60;

      db.insert(schema.interactions)
        .values({
          contactId: contact.id,
          sellerId: seller1.id,
          type: interactionTypes[j % interactionTypes.length],
          date: interactionDate.toISOString().split('T')[0],
          time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          notes: interactionNotes[(i + j) % interactionNotes.length],
          createdAt: SEED_DATE,
          updatedAt: SEED_DATE,
        })
        .run();
    }
  }

  console.log(`Created ${mariaContacts.length} contacts for Maria`);

  console.log('Database seeded successfully!');

  return {
    admin: adminUser,
    sellers: [seller1, seller2],
    contacts: mariaContacts,
  };
}

// Run seed if called directly
// Check if this module is being run directly (not imported) by comparing file paths
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1];
if (currentFile === entryFile || entryFile?.endsWith('seed.ts')) {
  const { db, rawDb, runMigrations } = await import('./index.js');
  runMigrations();
  await seedDatabase(db);
  rawDb.close();
}
