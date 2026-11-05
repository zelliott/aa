import { describe, expect, it } from 'vitest';
import { daysUntil, describeExpiry } from '../web/src/lib/format.js';

describe('expiry helpers', () => {
  const today = new Date(2030, 0, 10);

  it('counts days until a date', () => {
    expect(daysUntil('2030-01-10', today)).toBe(0);
    expect(daysUntil('2030-01-13', today)).toBe(3);
    expect(daysUntil('2030-01-08', today)).toBe(-2);
  });

  it('describes missing expiry dates', () => {
    expect(describeExpiry(null)).toEqual({ label: 'No expiry', tone: 'ok' });
  });
});
