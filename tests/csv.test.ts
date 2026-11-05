import { describe, expect, it } from 'vitest';
import { toCsv } from '../server/lib/csv.js';

describe('toCsv', () => {
  it('writes a header row and CRLF line endings', () => {
    expect(toCsv(['a', 'b'], [[1, 'x']])).toBe('a,b\r\n1,x\r\n');
  });

  it('quotes values containing commas, quotes or newlines', () => {
    const csv = toCsv(['name', 'notes'], [['Beans, black', 'say "hi"\nthere']]);
    expect(csv).toBe('name,notes\r\n"Beans, black","say ""hi""\nthere"\r\n');
  });

  it('leaves empty values blank', () => {
    expect(toCsv(['a', 'b', 'c'], [[null, undefined, 0]])).toBe('a,b,c\r\n,,0\r\n');
  });
});
