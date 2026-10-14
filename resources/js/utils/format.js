export const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const statusLabel = (value) => STATUSES.find((s) => s.value === value)?.label ?? value;
export const priorityLabel = (value) => PRIORITIES.find((p) => p.value === value)?.label ?? value;

/** "YYYY-MM-DD" -> local Date at midnight (avoids the UTC off-by-one-day trap). */
export function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Today's date in the user's own timezone, as "YYYY-MM-DD". */
export function todayISO() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Friendly due-date text plus a tone for styling.
 * Finished tasks are never "overdue": nobody needs nagging about done work.
 */
export function describeDueDate(value, status) {
  const date = parseDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((date - today) / 86_400_000);
  const formatted = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  if (status === 'done') return { text: `Due ${formatted}`, tone: 'muted' };
  if (days < -1) return { text: `Overdue · ${formatted}`, tone: 'danger' };
  if (days === -1) return { text: 'Overdue · yesterday', tone: 'danger' };
  if (days === 0) return { text: 'Due today', tone: 'warning' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warning' };
  if (days < 7) return { text: `Due ${date.toLocaleDateString(undefined, { weekday: 'long' })}`, tone: 'normal' };
  return { text: `Due ${formatted}`, tone: 'normal' };
}

/** ISO timestamp -> "5 minutes ago". */
export function timeAgo(value) {
  const seconds = Math.round((Date.now() - new Date(value)) / 1000);
  const units = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(-Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** e.g. "Tuesday, 14 October", in the user's own locale. */
export const todayLong = () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

export const firstName =(name = '') => name.trim().split(/\s+/)[0];
