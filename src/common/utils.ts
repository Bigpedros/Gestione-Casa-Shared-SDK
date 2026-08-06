/**
  * Cleans string and collapses multiple spaces into a single space.
  */
export function normalizeText(str: string | null | undefined): string | null {
  if (str === null || str === undefined) return null;
  const trimmed = str.trim().replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed : null;
}

/**
  * Normalizes email address to lowercase and trimmed string.
  */
export function normalizeEmail(email: string | null | undefined): string | null {
  const cleaned = normalizeText(email);
  return cleaned ? cleaned.toLowerCase() : null;
}

/**
  * Formal validation for email addresses.
  */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
  * Prudent phone number validation (allows +, spaces, dots, dashes, digits; length 3-25).
  */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return true; // Phone is usually nullable; if present, check form
  const cleaned = phone.trim();
  if (!cleaned) return true;
  const phoneRegex = /^\+?[0-9\s.\-()]{3,25}$/;
  const digitCount = (cleaned.match(/\d/g) || []).length;
  return phoneRegex.test(cleaned) && digitCount >= 3;
}

/**
  * Validates ISO 8601 date string format and value.
  */
export function isValidIsoDate(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  return !isNaN(Date.parse(dateStr));
}

/**
  * Checks if dateA is less than or equal to dateB (chronological order).
  */
export function isChronological(dateA: string, dateB: string): boolean {
  if (!isValidIsoDate(dateA) || !isValidIsoDate(dateB)) return false;
  return new Date(dateA).getTime() <= new Date(dateB).getTime();
}
