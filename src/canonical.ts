import crypto from 'crypto';

function sortKeys(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function canonicalStringify(value: unknown) {
  return JSON.stringify(sortKeys(value));
}

export function hashContent(value: unknown) {
  const canonical = canonicalStringify(value);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function byteSize(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}
