const KEY = 'momentum_user_key';

export function getUserKey() {
  if (typeof localStorage === 'undefined') return '';
  let value = localStorage.getItem(KEY);
  if (!value) {
    value = `user_${crypto.randomUUID()}`;
    localStorage.setItem(KEY, value);
  }
  return value;
}
