export type CsvValue = string | number | null | undefined;

function formatCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(','));
  return lines.join('\r\n') + '\r\n';
}
