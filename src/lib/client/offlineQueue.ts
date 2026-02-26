import { getUserKey } from './userKey';

const QUEUE_KEY = 'momentum_offline_queue';
const STATUS_KEY = 'momentum_offline_status';

export type QueuedSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  tag: string;
  feel: number;
  notes?: string;
  retries?: number;
  lastAttempt?: number;
};

function readQueue(): QueuedSession[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedSession[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSession[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSession(session: Omit<QueuedSession, 'id'>) {
  const queue = readQueue();
  queue.push({ ...session, id: `tmp_${crypto.randomUUID()}`, retries: 0, lastAttempt: 0 });
  writeQueue(queue);
}

export function getQueueStatus() {
  if (typeof localStorage === 'undefined') return { pending: 0, lastError: '' };
  const raw = localStorage.getItem(STATUS_KEY);
  if (!raw) return { pending: 0, lastError: '' };
  try {
    return JSON.parse(raw);
  } catch {
    return { pending: 0, lastError: '' };
  }
}

function setStatus(status: { pending: number; lastError: string }) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STATUS_KEY, JSON.stringify(status));
}

function backoffMs(retries = 0) {
  const base = Math.min(30000, 1000 * 2 ** retries);
  return base + Math.floor(Math.random() * 500);
}

export async function flushQueue() {
  const queue = readQueue();
  if (!queue.length) {
    setStatus({ pending: 0, lastError: '' });
    return;
  }
  const remaining: QueuedSession[] = [];
  let lastError = '';

  for (const item of queue) {
    const now = Date.now();
    const wait = backoffMs(item.retries || 0);
    if (item.lastAttempt && now - item.lastAttempt < wait) {
      remaining.push(item);
      continue;
    }
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-key': getUserKey()
        },
        body: JSON.stringify({
          startedAt: item.startedAt,
          endedAt: item.endedAt,
          duration: item.duration,
          tag: item.tag,
          feel: item.feel,
          notes: item.notes
        })
      });
      if (!res.ok) {
        remaining.push({ ...item, retries: (item.retries || 0) + 1, lastAttempt: now });
        lastError = `Sync failed (${res.status})`;
      }
    } catch {
      remaining.push({ ...item, retries: (item.retries || 0) + 1, lastAttempt: now });
      lastError = 'Sync failed (offline)';
    }
  }

  writeQueue(remaining);
  setStatus({ pending: remaining.length, lastError });
}
