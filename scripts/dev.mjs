#!/usr/bin/env node
/**
 * Starts backend then frontend for development.
 * Kills processes on ports 3000 and 5173 first (continues silently if none).
 * Supports --seed to seed the database.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const backendDir = join(rootDir, 'backend');
const frontendDir = join(rootDir, 'frontend');

const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;
const HEALTH_URL = `http://localhost:${BACKEND_PORT}/health`;

const withSeed = process.argv.includes('--seed');

async function killPorts() {
  const { default: killPort } = await import('kill-port');
  for (const port of [BACKEND_PORT, FRONTEND_PORT]) {
    try {
      await killPort(port);
    } catch {
      // No process on port – continue silently
    }
  }
}

async function isBackendRunning() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForBackend(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isBackendRunning()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  let backendProcess = null;

  await killPorts();

  const backendEnv = { ...process.env };
  if (withSeed) {
    backendEnv.SEED_DB = 'true';
    console.log('Starting backend with SEED_DB=true...');
  } else {
    console.log('Starting backend...');
  }

  backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: backendDir,
    env: backendEnv,
    stdio: 'inherit',
  });

  if (!(await waitForBackend())) {
    console.error('Backend failed to start within 15 seconds');
    backendProcess.kill('SIGTERM');
    process.exit(1);
  }
  console.log('Backend is ready. Starting frontend...');

  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
  });

  const cleanup = () => {
    if (backendProcess) backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const exitCode = await new Promise((resolve) => {
    frontendProcess.on('close', resolve);
  });

  if (backendProcess) backendProcess.kill('SIGTERM');
  process.exit(exitCode ?? 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
