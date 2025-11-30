import { serve } from '@hono/node-server';
import { db, initializeDatabase } from './db/index.js';
import { createApp } from './app.js';
import { seedDatabase } from './db/seed.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize database
initializeDatabase();

// Seed database if SEED_DB environment variable is set
if (process.env.SEED_DB === 'true') {
  console.log('Seeding database...');
  await seedDatabase(db);
}

// Create app
const app = createApp(db);

// Start server
console.log(`🔥 KeepWarm CRM API server running on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});



