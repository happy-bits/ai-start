// @ts-nocheck
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { stdin } from 'bun';

type StopHookInput = {
  conversation_id: string;
  generation_id: string;
  model: string;
  status: 'completed' | 'aborted' | 'error';
  loop_count: number;
};

type StopHookOutput = {
  followup_message?: string;
};

type MetricsEntry = {
  lastStatus: StopHookInput['status'];
  errorCount: number;
  lastUpdatedIso: string;
};

type MetricsStore = Record<string, MetricsEntry>;

const STATE_DIR = '.cursor/hooks/state';
const METRICS_PATH = `${STATE_DIR}/agent-metrics.json`;
const TELEMETRY_URL = Bun.env.AGENT_TELEMETRY_URL;

async function parseHookInput<T>(): Promise<T> {
  const text = await stdin.text();
  return JSON.parse(text) as T;
}

async function readMetrics(): Promise<MetricsStore> {
  try {
    return JSON.parse(await readFile(METRICS_PATH, 'utf8')) as MetricsStore;
  } catch {
    return {};
  }
}

async function writeMetrics(store: MetricsStore) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(METRICS_PATH, JSON.stringify(store, null, 2), 'utf8');
}

async function sendTelemetry(payload: StopHookInput, entry: MetricsEntry) {
  if (!TELEMETRY_URL) return;
  await fetch(TELEMETRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: payload.conversation_id,
      generationId: payload.generation_id,
      model: payload.model,
      status: payload.status,
      errorCount: entry.errorCount,
      loopCount: payload.loop_count,
      timestamp: entry.lastUpdatedIso
    })
  });
}

async function main() {
  // Läs från standard-in (vilken konversation, vilken modell...)
  const payload = await parseHookInput<StopHookInput>();

  // Läs från tidigare metrics (från en fil)
  const metrics = await readMetrics();

  // Referera till befintlig metric eller en ny oxh sätt datum och antal fel
  const entry =
    metrics[payload.conversation_id] ?? {
      lastStatus: payload.status,
      errorCount: 0,
      lastUpdatedIso: ''
    };

  entry.lastStatus = payload.status;
  entry.lastUpdatedIso = new Date().toISOString();
  entry.errorCount = payload.status === 'error' ? entry.errorCount + 1 : 0;

  metrics[payload.conversation_id] = entry;

  // Skriv metric i samma fil
  await writeMetrics(metrics);

  // Gör en POST till annat api
  await sendTelemetry(payload, entry);

  const response: StopHookOutput = {};
  if (entry.errorCount >= 2 && payload.loop_count < 4) {
    response.followup_message =
      'Automated retry triggered after two failures. Double-check credentials before running again.';
  }

  // Skicka response till standard output
  process.stdout.write(JSON.stringify(response) + '\n');
}

main().catch(error => {
  console.error('[stop hook] failed', error);
  process.stdout.write('{}\n');
});