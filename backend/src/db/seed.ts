import { hash } from '@node-rs/argon2';
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
    const pattern = [3, 1, 5, 0, 2, 4, 3, 2, 1, 5, 0, 4, 3, 2, 1, 0, 5, 4, 3, 2, 1, 0, 4, 3, 2, 5, 1, 0, 4, 3];
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
    'Erik Andersson', 'Anna Larsson', 'Johan Nilsson', 'Maria Johansson', 'Lars Eriksson',
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

  // Seed 30 contacts for seller1 (Maria)
  const mariaContacts = [];
  for (let i = 0; i < 30; i++) {
    const contact = db
      .insert(schema.contacts)
      .values({
        sellerId: seller1.id,
        name: swedishNames[i],
        email: `${swedishNames[i].toLowerCase().replace(' ', '.')}@${companies[i].toLowerCase().replace(/\s+/g, '')}.se`,
        phone: `+46 70 ${String(123 + i).padStart(3, '0')} ${String(45 + i).padStart(2, '0')} ${String(67 + i).padStart(2, '0')}`,
        company: companies[i],
        followUpDate: getFollowUpDate(i),
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      })
      .returning()
      .get();
    mariaContacts.push(contact);
  }

  // Seed interactions for Maria's contacts (0-5 per contact)
  const interactionTypes: Array<'call' | 'meeting' | 'email'> = ['call', 'meeting', 'email'];
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
    'Kvalificerade lead och behov.'
  ];

  for (let i = 0; i < mariaContacts.length; i++) {
    const contact = mariaContacts[i];
    const interactionCount = getInteractionCount(i);
    
    // Generate interactions with dates before the follow-up date
    const followUpDate = new Date(contact.followUpDate!);
    
    for (let j = 0; j < interactionCount; j++) {
      // Distribute interactions over time before follow-up date
      const daysBefore = (interactionCount - j) * 7 + (j * 3); // Spread out interactions
      const interactionDate = new Date(followUpDate);
      interactionDate.setDate(interactionDate.getDate() - daysBefore);
      
      // Ensure date is within reasonable range (not before 2025-11-01)
      const minDate = new Date('2025-11-01');
      if (interactionDate < minDate) {
        interactionDate.setTime(minDate.getTime() + (j * 86400000)); // Add days if needed
      }
      
      const hour = 9 + (j % 8); // Distribute times throughout the day
      const minute = (j * 15) % 60;
      
      db.insert(schema.interactions).values({
        contactId: contact.id,
        sellerId: seller1.id,
        type: interactionTypes[j % interactionTypes.length],
        date: interactionDate.toISOString().split('T')[0],
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        notes: interactionNotes[(i + j) % interactionNotes.length],
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      }).run();
    }
  }

  // Seed contacts for seller2 (Lars)
  const larsContacts = [];
  
  const contact3 = db
    .insert(schema.contacts)
    .values({
      sellerId: seller2.id,
      name: 'Johan Nilsson',
      email: 'johan.nilsson@ikea.se',
      phone: '+46 73 345 67 89',
      company: 'IKEA Sverige',
      followUpDate: '2026-01-03',
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
      phone: '+46 73 456 78 90',
      company: 'AstraZeneca Sverige',
      followUpDate: '2026-01-10',
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
      phone: '+46 73 567 89 01',
      company: 'Telia Company',
      followUpDate: '2025-12-15',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    })
    .returning()
    .get();
  larsContacts.push(contact5);

  console.log(`Created ${mariaContacts.length} contacts for Maria`);
  console.log(`Created ${larsContacts.length} contacts for Lars`);

  // Seed interactions for Lars's contacts
  // Contact 3 (Johan Nilsson) - 1 interaction
  db.insert(schema.interactions).values({
    contactId: contact3.id,
    sellerId: seller2.id,
    type: 'meeting',
    date: '2026-01-02',
    time: '15:30',
    notes: 'Möte på plats vid deras huvudkontor.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  // Contact 4 (Kristina Wallin) - 3 interactions
  db.insert(schema.interactions).values({
    contactId: contact4.id,
    sellerId: seller2.id,
    type: 'call',
    date: '2025-12-20',
    time: '10:00',
    notes: 'Inledande samtal om deras CRM-behov.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  db.insert(schema.interactions).values({
    contactId: contact4.id,
    sellerId: seller2.id,
    type: 'email',
    date: '2025-12-28',
    time: '14:30',
    notes: 'Skickade produktinformation och case studies.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  db.insert(schema.interactions).values({
    contactId: contact4.id,
    sellerId: seller2.id,
    type: 'meeting',
    date: '2026-01-05',
    time: '11:00',
    notes: 'Demo-session med beslutsfattare och IT-team.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  // Contact 5 (Robert Lindgren) - 2 interactions
  db.insert(schema.interactions).values({
    contactId: contact5.id,
    sellerId: seller2.id,
    type: 'call',
    date: '2025-12-01',
    time: '09:15',
    notes: 'Kallt samtal. Intresserad av vår lösning.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  db.insert(schema.interactions).values({
    contactId: contact5.id,
    sellerId: seller2.id,
    type: 'email',
    date: '2025-12-10',
    time: '16:45',
    notes: 'Uppföljning med prisinformation och implementeringsplan.',
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  }).run();

  console.log('Database seeded successfully!');

  return {
    admin: adminUser,
    sellers: [seller1, seller2],
    contacts: [...mariaContacts, ...larsContacts],
  };
}

// Run seed if called directly
// Check if this module is being run directly (not imported) by comparing file paths
import { fileURLToPath } from 'url';
const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1];
if (currentFile === entryFile || entryFile?.endsWith('seed.ts')) {
  const { db, rawDb } = await import('./index.js');
  const { initializeDatabase } = await import('./index.js');
  initializeDatabase();
  await seedDatabase(db);
  rawDb.close();
}



