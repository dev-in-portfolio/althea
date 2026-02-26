export function getUserKey(): string {
  if (typeof window === 'undefined') return '';
  const stored = window.localStorage.getItem('timeslice_user_key');
  if (stored) return stored;
  const key = crypto.randomUUID();
  window.localStorage.setItem('timeslice_user_key', key);
  return key;
}
