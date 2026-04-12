/**
 * Input sanitization & validation utilities.
 * Used by all controllers — never trust req.body / req.params / req.query directly.
 */

// Strip HTML tags and null bytes from a string
const clean = (val) =>
  typeof val === 'string'
    ? val.replace(/<[^>]*>/g, '').replace(/\0/g, '').trim()
    : val;

// Recursively sanitize every string in an object or array
export const sanitizeBody = (obj) => {
  if (Array.isArray(obj)) return obj.map(sanitizeBody);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeBody(v)])
    );
  }
  return clean(obj);
};

// Validate & parse a positive integer from a route param — throws on bad input
export const parseId = (raw) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    const err = new Error('Invalid ID');
    err.status = 400;
    throw err;
  }
  return n;
};

// Whitelist-based string validator — returns cleaned value or throws
export const requireString = (val, field, maxLen = 255) => {
  const s = clean(val);
  if (!s) {
    const err = new Error(`${field} is required`);
    err.status = 400;
    throw err;
  }
  if (s.length > maxLen) {
    const err = new Error(`${field} exceeds maximum length of ${maxLen}`);
    err.status = 400;
    throw err;
  }
  return s;
};

// Validate email format
export const requireEmail = (val, field = 'email') => {
  const s = clean(val);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    const err = new Error(`${field} is not a valid email address`);
    err.status = 400;
    throw err;
  }
  return s.toLowerCase();
};

// Validate enum membership
export const requireEnum = (val, field, allowed) => {
  const s = clean(val);
  if (!allowed.includes(s)) {
    const err = new Error(`${field} must be one of: ${allowed.join(', ')}`);
    err.status = 400;
    throw err;
  }
  return s;
};

// Validate positive integer field from body
export const requireInt = (val, field, min = 0, max = 9999) => {
  const n = Number(val);
  if (!Number.isInteger(n) || n < min || n > max) {
    const err = new Error(`${field} must be an integer between ${min} and ${max}`);
    err.status = 400;
    throw err;
  }
  return n;
};

// Validate a date string (YYYY-MM-DD)
export const requireDate = (val, field = 'date') => {
  const s = clean(val);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(Date.parse(s))) {
    const err = new Error(`${field} must be a valid date (YYYY-MM-DD)`);
    err.status = 400;
    throw err;
  }
  return s;
};

// Sanitize a comma-separated list field (skills, activities, etc.)
export const sanitizeList = (val) => {
  if (Array.isArray(val)) return val.map(clean).filter(Boolean).slice(0, 50);
  if (typeof val === 'string') return val.split(',').map(clean).filter(Boolean).slice(0, 50);
  return [];
};

// Express middleware — sanitizes req.body in place
export const sanitizeRequest = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeBody(req.body);
  }
  next();
};
