const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  timeZone: 'UTC',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

type DateLike = string | number | Date | null | undefined;

const toDate = (value: DateLike): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const date =
    typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : value;

  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Formats a date consistently using UTC to avoid hydration mismatches.
 * Returns an em dash (—) when the value is missing or invalid.
 */
export const formatUTCDate = (value: DateLike): string => {
  const date = toDate(value);
  return date ? DATE_FORMATTER.format(date) : '—';
};

/**
 * Formats a date and time consistently using UTC (24-hour clock).
 */
export const formatUTCDateTime = (value: DateLike): string => {
  const date = toDate(value);
  return date ? DATE_TIME_FORMATTER.format(date) : '—';
};

/**
 * Formats only the time portion using UTC (24-hour clock).
 */
export const formatUTCTime = (value: DateLike): string => {
  const date = toDate(value);
  return date ? TIME_FORMATTER.format(date) : '—';
};

