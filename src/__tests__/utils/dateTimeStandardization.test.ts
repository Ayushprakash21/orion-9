import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime, formatDateOnly } from '../../lib/formatters';
import { formatDateTime } from '../../core/utils';

describe('Date/Time Standardization & Timezone Fidelity Suite', () => {
  const TEST_ISO = '2026-10-08T08:00:00.000Z';

  it('formats dates consistently in specified timezone (Asia/Kolkata)', () => {
    const formatted = formatDate(TEST_ISO, 'Asia/Kolkata');
    // 08:00 UTC = 13:30 IST (+5:30)
    expect(formatted).toContain('2026');
    expect(formatted).toContain('01:30');
    expect(formatted).toMatch(/PM|GMT\+5:30|IST/);
  });

  it('formats dates consistently in UTC timezone', () => {
    const formatted = formatDate(TEST_ISO, 'UTC');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('08:00');
  });

  it('handles invalid date values gracefully with fallback string N/A', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
    expect(formatDate('invalid-iso-date')).toBe('N/A');
    expect(formatDate({})).toBe('N/A');
    expect(formatDate(NaN)).toBe('N/A');

    expect(formatDateTime('invalid-iso-date')).toBe('N/A');
  });

  it('formatDateOnly strips time and maintains calendar date', () => {
    const dateOnly = formatDateOnly(TEST_ISO, 'Asia/Kolkata');
    expect(dateOnly).toContain('08');
    expect(dateOnly).toContain('Oct');
    expect(dateOnly).toContain('2026');
  });

  it('formatRelativeTime produces accurate human readable relative strings', () => {
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400 * 1000);

    expect(formatRelativeTime(tenSecondsAgo)).toBe('Just now');
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 min ago');
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hr ago');
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    expect(formatRelativeTime('not-a-date')).toBe('N/A');
  });
});
