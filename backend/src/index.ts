import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { db, resetDatabase, runMigrations } from './db/index.js';
import { seedDatabase } from './db/seed.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Run migrations on startup
runMigrations();

// Seed database if SEED_DB environment variable is set
if (process.env.SEED_DB === 'true') {
  console.log('Resetting database...');
  resetDatabase();

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
