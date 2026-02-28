import { getDeviceKey } from './deviceKey';

export type CardType = 'text' | 'image' | 'embed' | 'quote';

export type Card = {
  id: string;
  type: CardType;
  ord: number;
  title: string;
  body: string;
  image_url: string;
  embed_url: string;
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  published_slug?: string | null;
  created_at: string;
  updated_at: string;
};

const base = '/api/cardpress';

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

export async function listPages() {
  const data = await request('/pages');
  return data.pages as Page[];
}

export async function createPage(title: string, slug: string) {
  const data = await request('/pages', {
    method: 'POST',
    body: JSON.stringify({ title, slug }),
  });
  return data.page as Page;
}

export async function fetchPage(id: string) {
  const data = await request(`/pages/${id}`);
  return data as { page: Page; cards: Card[] };
}

export async function updatePage(id: string, payload: Partial<{ title: string; slug: string; status: 'draft' | 'published' }>) {
  const data = await request(`/pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.page as Page;
}

export async function deletePage(id: string) {
  await request(`/pages/${id}`, { method: 'DELETE' });
}

export async function addCard(pageId: string, payload: Partial<Card> & { type: CardType; ord: number }) {
  const data = await request(`/pages/${pageId}/cards`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.card as Card;
}

export async function updateCard(cardId: string, payload: Partial<Card>) {
  const data = await request(`/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.card as Card;
}

export async function deleteCard(cardId: string) {
  await request(`/cards/${cardId}`, { method: 'DELETE' });
}

export async function fetchPublic(publishedSlug: string) {
  const res = await fetch(`${base}/public/${publishedSlug}`);
  if (!res.ok) throw new Error('Page not found');
  return res.json() as Promise<{ page: Page; cards: Card[] }>;
}
