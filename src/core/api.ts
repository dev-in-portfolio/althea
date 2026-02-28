import { getDeviceKey } from './deviceKey';

export type Signal = {
  id: string;
  name: string;
  kind: string;
  status: 'ok' | 'warn' | 'bad';
  note: string;
  value_num: number | null;
  value_unit: string;
  updated_at: string;
  created_at: string;
};

export type Rule = {
  warn_if_gt?: number | null;
  warn_if_lt?: number | null;
  bad_if_gt?: number | null;
  bad_if_lt?: number | null;
};

const base = '/api/signalboard';

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-Device-Key', getDeviceKey());
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || 'Request failed');
  }
  return res.json();
}

export async function listSignals() {
  const data = await request('/signals');
  return data.signals as Signal[];
}

export async function createSignal(payload: Partial<Signal> & { name: string }) {
  const data = await request('/signals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.signal as Signal;
}

export async function updateSignal(id: string, payload: Partial<Signal>) {
  const data = await request(`/signals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.signal as Signal;
}

export async function deleteSignal(id: string) {
  await request(`/signals/${id}`, { method: 'DELETE' });
}

export async function getRule(id: string) {
  const data = await request(`/signals/${id}/rule`);
  return data.rule as Rule | null;
}

export async function upsertRule(id: string, payload: Rule) {
  const data = await request(`/signals/${id}/rule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.rule as Rule;
}

export async function deleteRule(id: string) {
  await request(`/signals/${id}/rule`, { method: 'DELETE' });
}

export async function fetchBoard() {
  const data = await request('/board');
  return data.signals as Signal[];
}
