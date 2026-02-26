const URL_RE = /^https?:\/\//i;

export function validateProjectTitle(title: string) {
  if (!title || title.trim().length < 1 || title.trim().length > 80) {
    return 'Title must be 1-80 characters.';
  }
  return null;
}

export function validateFrameInput(input: { title: string; body: string; imageUrl: string | null }) {
  if (!input.body || input.body.trim().length === 0 || input.body.length > 20000) {
    return 'Body must be non-empty and under 20k characters.';
  }
  if (input.title && input.title.length > 120) {
    return 'Title must be <= 120 characters.';
  }
  if (input.imageUrl) {
    if (input.imageUrl.length > 500) return 'Image URL too long.';
    if (!URL_RE.test(input.imageUrl)) return 'Image URL must be http(s).';
  }
  return null;
}

export function validateOrder(order: string[], existing: string[]) {
  if (order.length !== existing.length) return 'Order length mismatch.';
  const orderSet = new Set(order);
  if (orderSet.size !== order.length) return 'Order contains duplicates.';
  for (const id of existing) {
    if (!orderSet.has(id)) return 'Order must contain all frame IDs.';
  }
  return null;
}
