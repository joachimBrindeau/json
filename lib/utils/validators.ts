/**
 * Validation utility functions
 * Provides pure validation functions for common patterns
 */

/**
 * Validate email format using RFC 5322 simplified pattern
 * @param email - Email string to validate
 * @returns True if valid email format
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid.email') // false
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format (HTTP/HTTPS only)
 * @param url - URL string to validate
 * @returns True if valid URL
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('not-a-url') // false
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate JSON string
 * @param jsonString - String to validate as JSON
 * @returns True if valid JSON
 * @example
 * isValidJson('{"key": "value"}') // true
 * isValidJson('not json') // false
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate hex color code
 * @param color - Color string to validate
 * @returns True if valid hex color (#RGB or #RRGGBB)
 * @example
 * isValidHexColor('#fff') // true
 * isValidHexColor('#ffffff') // true
 * isValidHexColor('ffffff') // false
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Validate UUID format (v4)
 * @param uuid - UUID string to validate
 * @returns True if valid UUID v4 format
 * @example
 * isValidUuid('550e8400-e29b-41d4-a716-446655440000') // true
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate semantic version string
 * @param version - Version string to validate
 * @returns True if valid semver format
 * @example
 * isValidSemver('1.2.3') // true
 * isValidSemver('1.2.3-alpha') // true
 * isValidSemver('1.2') // false
 */
export function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/.test(version);
}

/**
 * Validate ISO date string
 * @param dateString - Date string to validate
 * @returns True if valid ISO date format
 * @example
 * isValidIsoDate('2025-10-13T10:30:00Z') // true
 * isValidIsoDate('2025-10-13') // true
 */
export function isValidIsoDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @param options - Validation options
 * @returns Validation result with strength score
 * @example
 * isStrongPassword('Passw0rd!') // { valid: true, score: 4, feedback: [] }
 */
export function isStrongPassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): { valid: boolean; score: number; feedback: string[] } {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options;

  const feedback: string[] = [];
  let score = 0;

  if (password.length < minLength) {
    feedback.push(`Password must be at least ${minLength} characters`);
  } else {
    score++;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('Password must contain uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score++;
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    feedback.push('Password must contain lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score++;
  }

  if (requireNumbers && !/\d/.test(password)) {
    feedback.push('Password must contain number');
  } else if (/\d/.test(password)) {
    score++;
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  }

  return {
    valid: feedback.length === 0,
    score,
    feedback,
  };
}

/**
 * Validate credit card number using Luhn algorithm
 * @param cardNumber - Credit card number (with or without spaces/dashes)
 * @returns True if valid card number
 * @example
 * isValidCreditCard('4532015112830366') // true
 * isValidCreditCard('1234567890123456') // false
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate phone number (US format)
 * @param phone - Phone number string
 * @returns True if valid US phone number
 * @example
 * isValidPhoneNumber('(555) 123-4567') // true
 * isValidPhoneNumber('555-123-4567') // true
 * isValidPhoneNumber('5551234567') // true
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return /^\d{10}$/.test(cleaned);
}

/**
 * Validate JSON path format
 * @param path - JSON path string (e.g., "$.store.book[0].title")
 * @returns True if valid JSON path
 * @example
 * isValidJsonPath('$.store.book[0]') // true
 * isValidJsonPath('invalid path') // false
 */
export function isValidJsonPath(path: string): boolean {
  return /^(\$\.?|\$\[|\.)[\w\[\]\.'"$-]*$/.test(path) || path === '$';
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if empty
 * @example
 * isEmpty('') // true
 * isEmpty([]) // true
 * isEmpty({}) // true
 * isEmpty(null) // true
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate file size is within limits
 * @param bytes - File size in bytes
 * @param maxMB - Maximum size in megabytes
 * @returns True if within limit
 * @example
 * isValidFileSize(1024 * 1024, 2) // true (1MB < 2MB)
 * isValidFileSize(3 * 1024 * 1024, 2) // false (3MB > 2MB)
 */
export function isValidFileSize(bytes: number, maxMB: number): boolean {
  return bytes <= maxMB * 1024 * 1024;
}

/**
 * Validate file type against allowed extensions
 * @param filename - Filename to check
 * @param allowedExtensions - Array of allowed extensions (e.g., ['.json', '.txt'])
 * @returns True if extension is allowed
 * @example
 * isValidFileType('data.json', ['.json', '.txt']) // true
 * isValidFileType('data.exe', ['.json', '.txt']) // false
 */
export function isValidFileType(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.map((e) => e.toLowerCase()).includes(ext);
}

/**
 * Validate username format
 * @param username - Username to validate
 * @param options - Validation options
 * @returns True if valid username
 * @example
 * isValidUsername('john_doe') // true
 * isValidUsername('j') // false (too short)
 */
export function isValidUsername(
  username: string,
  options: { minLength?: number; maxLength?: number } = {}
): boolean {
  const { minLength = 3, maxLength = 20 } = options;
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;

  return (
    username.length >= minLength && username.length <= maxLength && usernameRegex.test(username)
  );
}
