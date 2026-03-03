#!/usr/bin/env node
/**
 * Runs frontend e2e tests. Starts backend on port 3001 if not already running.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const backendDir = join(rootDir, 'backend');
const frontendDir = join(rootDir, 'frontend');

const HEALTH_URL = 'http://localhost:3001/health';

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

  if (!(await isBackendRunning())) {
    console.log('Backend not running, starting backend...');
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendDir,
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    if (!(await waitForBackend())) {
      console.error('Backend failed to start within 15 seconds');
      backendProcess.kill('SIGTERM');
      process.exit(1);
    }
    console.log('Backend is ready.');
  }

  console.log('============ 🧪 Frontend e2e tests ============');
  const e2eProcess = spawn('npm', ['run', 'test:e2e'], {
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
