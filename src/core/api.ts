import { getDeviceKey } from './deviceKey';

export type ViewState = {
  q: string;
  filters: { tag?: string[]; status?: string[] };
  sort: { field: string; dir: 'asc' | 'desc' };
  columns: string[];
  pageSize: number;
};

export type SwitchboardView = {
  id: string;
  name: string;
  route: string;
  state: ViewState;
  created_at: string;
  updated_at: string;
};

const base = '/api/switchboard';

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

export async function fetchViews(route: string): Promise<SwitchboardView[]> {
  const data = await request(`/views?route=${encodeURIComponent(route)}`);
  return data.views;
}

export async function createView(name: string, route: string, state: ViewState) {
  const data = await request('/views', {
    method: 'POST',
    body: JSON.stringify({ name, route, state }),
  });
  return data.view as SwitchboardView;
}

export async function updateView(id: string, payload: Partial<{ name: string; state: ViewState }>) {
  const data = await request(`/views/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.view as SwitchboardView;
}

export async function deleteView(id: string) {
  await request(`/views/${id}`, { method: 'DELETE' });
}

export async function fetchShare(id: string) {
  const res = await fetch(`${base}/share/${id}`);
  if (!res.ok) throw new Error('Share not found');
  const data = await res.json();
  return data.view as SwitchboardView;
}
