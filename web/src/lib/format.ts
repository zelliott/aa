const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const BOLD = /\*\*([^*]+)\*\*/g;

export function formatNotes(notes: string): string {
  return notes
    .replace(LINK, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(BOLD, '<strong>$1</strong>')
    .replace(/\r?\n/g, '<br>');
}

export function daysUntil(date: string, today = new Date()): number {
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = date.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - start) / 86_400_000);
}

export function describeExpiry(date: string | null): { label: string; tone: 'ok' | 'soon' | 'past' } {
  if (!date) return { label: 'No expiry', tone: 'ok' };
  const days = daysUntil(date);
  if (days < 0) return { label: `Expired ${-days}d ago`, tone: 'past' };
  if (days === 0) return { label: 'Expires today', tone: 'soon' };
  if (days <= 3) return { label: `Expires in ${days}d`, tone: 'soon' };
  return { label: date, tone: 'ok' };
}
