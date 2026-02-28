export function getDeviceKey(): string {
  const key = 'switchboard_device_key';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const uuid = crypto.randomUUID();
  localStorage.setItem(key, uuid);
  return uuid;
}
