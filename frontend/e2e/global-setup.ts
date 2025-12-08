import { spawn, ChildProcess } from 'child_process';
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const backendDir = join(rootDir, '..', 'backend');

// Number of parallel workers
const WORKER_COUNT = 3;

// Port configuration per worker
export const getWorkerPorts = (workerIndex: number) => ({
  backend: 3001 + workerIndex,
  frontend: 5174 + workerIndex,
});

interface ServerProcess {
  process: ChildProcess;
  type: 'backend' | 'frontend';
  workerIndex: number;
}

const processes: ServerProcess[] = [];

// Wait for a server to be ready by polling the health endpoint
async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

// Start a backend instance for a worker
async function startBackend(workerIndex: number): Promise<ChildProcess> {
  const ports = getWorkerPorts(workerIndex);
  const dbPath = join(backendDir, `test-worker-${workerIndex}.db`);

  // Remove old database file if exists
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }

  const proc = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(ports.backend),
      DB_PATH: dbPath,
      SEED_DB: 'true',
    },
    stdio: 'pipe',
  });

  proc.stdout?.on('data', (data) => {
    if (process.env.DEBUG) {
      console.log(`[Backend ${workerIndex}] ${data.toString().trim()}`);
    }
  });

  proc.stderr?.on('data', (data) => {
    if (process.env.DEBUG) {
      console.error(`[Backend ${workerIndex} ERR] ${data.toString().trim()}`);
    }
  });

  processes.push({ process: proc, type: 'backend', workerIndex });

  // Wait for backend to be ready
  await waitForServer(`http://localhost:${ports.backend}/health`);
  console.log(`✅ Backend ${workerIndex} ready on port ${ports.backend}`);

  return proc;
}

// Start a frontend instance for a worker
async function startFrontend(workerIndex: number): Promise<ChildProcess> {
  const ports = getWorkerPorts(workerIndex);

  const proc = spawn('npx', ['vite', '--port', String(ports.frontend)], {
    cwd: rootDir,
    env: {
      ...process.env,
      BACKEND_PORT: String(ports.backend),
      FRONTEND_PORT: String(ports.frontend),
    },
    stdio: 'pipe',
  });

  proc.stdout?.on('data', (data) => {
    if (process.env.DEBUG) {
      console.log(`[Frontend ${workerIndex}] ${data.toString().trim()}`);
    }
  });

  proc.stderr?.on('data', (data) => {
    if (process.env.DEBUG) {
      console.error(`[Frontend ${workerIndex} ERR] ${data.toString().trim()}`);
    }
  });

  processes.push({ process: proc, type: 'frontend', workerIndex });

  // Wait for frontend to be ready
  await waitForServer(`http://localhost:${ports.frontend}`);
  console.log(`✅ Frontend ${workerIndex} ready on port ${ports.frontend}`);

  return proc;
}

// Global setup - starts all servers
export default async function globalSetup() {
  console.log(`\n🚀 Starting ${WORKER_COUNT} backend/frontend pairs for parallel testing...\n`);

  // Start all backends first
  for (let i = 0; i < WORKER_COUNT; i++) {
    await startBackend(i);
  }

  // Then start all frontends
  for (let i = 0; i < WORKER_COUNT; i++) {
    await startFrontend(i);
  }

  // Store process PIDs for teardown
  const pidsDir = join(rootDir, '.e2e-pids');
  if (!existsSync(pidsDir)) {
    mkdirSync(pidsDir, { recursive: true });
  }

  const pids = processes.map((p) => ({
    pid: p.process.pid,
    type: p.type,
    workerIndex: p.workerIndex,
  }));
  writeFileSync(join(pidsDir, 'pids.json'), JSON.stringify(pids, null, 2));

  console.log(`\n✅ All ${WORKER_COUNT} worker environments ready!\n`);
}
