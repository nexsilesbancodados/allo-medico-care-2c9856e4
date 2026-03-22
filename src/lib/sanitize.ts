/**
 * Input sanitization utilities for XSS prevention and data integrity.
 */

/** Strip HTML tags from user input */
export const stripHtml = (input: string): string =>
  input.replace(/<[^>]*>/g, "");

/** Sanitize general text input: trim, strip HTML, limit length */
export const sanitizeText = (input: string, maxLength = 500): string =>
  stripHtml(input).trim().slice(0, maxLength);

/** Sanitize name fields: allow only letters, spaces, hyphens, apostrophes */
export const sanitizeName = (input: string, maxLength = 100): string =>
  input
    .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "")
    .trim()
    .slice(0, maxLength);

/** Sanitize phone: keep only digits and + */
export const sanitizePhone = (input: string): string =>
  input.replace(/[^\d+]/g, "").slice(0, 20);

/** Sanitize email: lowercase, trim, basic format */
export const sanitizeEmail = (input: string): string =>
  input.toLowerCase().trim().slice(0, 255);

/** Prevent prototype pollution in JSON parsing */
export const safeJsonParse = <T>(input: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === "object" && parsed !== null) {
      if ("__proto__" in parsed || "constructor" in parsed || "prototype" in parsed) {
        return fallback;
      }
    }
    return parsed as T;
  } catch {
    return fallback;
  }
};

/** Validate UUID format */
export const isValidUUID = (input: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);

/** Encode user input for safe URL usage */
export const safeEncodeURI = (input: string): string =>
  encodeURIComponent(stripHtml(input.trim()));
