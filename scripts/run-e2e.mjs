#!/usr/bin/env node
/**
 * Runs frontend e2e tests. Starts backend on port 3001 with keepwarm.db (never keepwarm-prod).
 * Kills any existing backend first to ensure E2E always uses the dev database.
 *
 * Usage:
 *   node scripts/run-e2e.mjs           - run e2e tests
 *   node scripts/run-e2e.mjs --debug    - run e2e tests in debug mode (interactive stepping)
 *   node scripts/run-e2e.mjs --debug e2e/contact-delete.spec.ts  - debug specific file
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const backendDir = join(rootDir, 'backend');
const frontendDir = join(rootDir, 'frontend');
const E2E_DB_PATH = join(backendDir, 'data/keepwarm.db');

const HEALTH_URL = 'http://localhost:3001/health';

async function killBackendPort() {
  const { default: killPort } = await import('kill-port');
  try {
    await killPort(3001);
  } catch {
    // No process on port – continue silently
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
  console.log('Starting backend for E2E (using keepwarm.db)...');
  await killBackendPort();

  const backendEnv = { ...process.env, DB_PATH: E2E_DB_PATH };
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: backendDir,
    env: backendEnv,
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  if (!(await waitForBackend())) {
    console.error('Backend failed to start within 15 seconds');
    backendProcess.kill('SIGTERM');
    process.exit(1);
  }
  console.log('Backend is ready.');

  const args = process.argv.slice(2);
  const isDebug = args.includes('--debug');
  const e2eArgs = args.filter((a) => a !== '--debug');
  const e2eScript = isDebug ? 'test:e2e:debug' : 'test:e2e';

  console.log('============ 🧪 Frontend e2e tests ============');
  const e2eProcess = spawn('npm', ['run', e2eScript, '--', ...e2eArgs], {
    cwd: frontendDir,
    stdio: 'inherit',
  });

  const exitCode = await new Promise((resolve) => {
    e2eProcess.on('close', resolve);
  });

  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }

  process.exit(exitCode ?? 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
