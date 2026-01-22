import DOMPurify from 'dompurify';

/**
 * Sanitizes a string to prevent XSS attacks.
 * Since we are capturing plain text from contentEditable, we strip all HTML tags.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // We only want plain text from our screenplay editor
    ALLOWED_ATTR: []
  });
};