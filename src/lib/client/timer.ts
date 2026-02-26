const TIMER_KEY = 'momentum_timer_start';

export function getStoredStart() {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(TIMER_KEY);
  return value ? new Date(value) : null;
}

export function setStoredStart(date: Date) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(TIMER_KEY, date.toISOString());
}

export function clearStoredStart() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(TIMER_KEY);
}

export function secondsBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}
