/**
 * Pagination and limit utilities for API endpoints
 */

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Default pagination limits */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

/**
 * Parse and clamp limit from query params
 */
export function parseLimit(
  value: string | null,
  defaultLimit = PAGINATION.DEFAULT_LIMIT,
  maxLimit = PAGINATION.MAX_LIMIT
): number {
  if (!value) return defaultLimit;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultLimit;
  return clamp(parsed, PAGINATION.MIN_LIMIT, maxLimit);
}

/**
 * Parse and clamp offset from query params
 */
export function parseOffset(value: string | null): number {
  if (!value) return PAGINATION.DEFAULT_OFFSET;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) return PAGINATION.DEFAULT_OFFSET;
  return parsed;
}

/**
 * Parse page number (1-based) and convert to offset
 */
export function parsePage(value: string | null, limit: number): number {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) return 0;
  return (parsed - 1) * limit;
}

/**
 * Parse year with validation
 */
export function parseYear(
  value: string | null,
  defaultYear = new Date().getFullYear(),
  minYear = 1900,
  maxYear = 2100
): number | null {
  if (!value) return defaultYear;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return null;
  if (parsed < minYear || parsed > maxYear) return null;
  return parsed;
}
