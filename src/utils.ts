import crypto from 'crypto';

export function canonicalJson(value: unknown) {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

export function payloadSize(payload: unknown) {
  const serialized = JSON.stringify(payload);
  return Buffer.byteLength(serialized, 'utf8');
}

export function hashPayload(payload: unknown) {
  const serialized = JSON.stringify(payload);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
