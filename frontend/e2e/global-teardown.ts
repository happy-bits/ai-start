import { existsSync, readFileSync, unlinkSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const backendDir = join(rootDir, '..', 'backend');

interface StoredPid {
  pid: number;
  type: 'backend' | 'frontend';
  workerIndex: number;
}

// Kill a process by PID
function killProcess(pid: number): boolean {
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    // Process might already be dead
    return false;
  }
}

// Global teardown - stops all servers and cleans up
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test servers...\n');

  const pidsFile = join(rootDir, '.e2e-pids', 'pids.json');

  if (existsSync(pidsFile)) {
    try {
      const pids: StoredPid[] = JSON.parse(readFileSync(pidsFile, 'utf-8'));

      for (const { pid, type, workerIndex } of pids) {
        if (killProcess(pid)) {
          console.log(`  ✓ Stopped ${type} ${workerIndex} (PID: ${pid})`);
        }
      }

      // Clean up pids file
      unlinkSync(pidsFile);
    } catch (error) {
      console.error('Error reading/killing processes:', error);
    }
  }

  // Clean up test database files
  for (let i = 0; i < 3; i++) {
    const dbPath = join(backendDir, `test-worker-${i}.db`);
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;

    for (const file of [dbPath, walPath, shmPath]) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
          console.log(`  ✓ Removed ${file}`);
        } catch {
          // File might be locked
        }
      }
    }
  }

  // Clean up pids directory
  const pidsDir = join(rootDir, '.e2e-pids');
  if (existsSync(pidsDir)) {
    try {
      rmSync(pidsDir, { recursive: true });
    } catch {
      // Directory might not be empty
    }
  }

  console.log('\n✅ Cleanup complete!\n');
}
