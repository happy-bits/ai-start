import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dataDir = path.join(process.cwd(), 'data');
const DB_PATH =
  process.env.DB_PATH ||
  (existsSync(path.join(dataDir, 'keepwarm-prod'))
    ? path.join(dataDir, 'keepwarm-prod')
    : path.join(dataDir, 'keepwarm.db'));
const BACKUP_ROOT = path.join(process.cwd(), '..', '..', 'backup', 'keepwarm');

function getBackupFilename(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const time = now.toTimeString().slice(0, 8).replaceAll(':', '');
  return `${date}_${time}.db`;
}

async function backup(): Promise<void> {
  if (!existsSync(DB_PATH)) {
    console.error(`Fel: Databasen finns inte: ${DB_PATH}`);
    process.exit(1);
  }

  const backupFile = path.join(BACKUP_ROOT, getBackupFilename());
  if (existsSync(backupFile)) {
    console.error(`Fel: Backup-filen finns redan: ${backupFile}`);
    process.exit(1);
  }

  mkdirSync(BACKUP_ROOT, { recursive: true });

  const db = new Database(DB_PATH, { readonly: true });
  try {
    await db.backup(backupFile);
    console.log(`Backup skapad: ${backupFile}`);
  } finally {
    db.close();
  }
}

backup().catch((err) => {
  console.error('Backup misslyckades:', err);
  process.exit(1);
});
