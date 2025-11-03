/**
 * Validation utilities for node details
 * Pure functions for data validation
 */

import type { ValidationResult } from '../types';

// ============================================================================
// Email Validation
// ============================================================================

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  if (!isValid) {
    const suggestions: string[] = [];

    // Common typos
    if (!email.includes('@')) {
      suggestions.push('Email must contain @ symbol');
    } else if (!email.split('@')[1]?.includes('.')) {
      suggestions.push('Domain must contain a dot (.)');
    }

    // Check for spaces
    if (email.includes(' ')) {
      suggestions.push('Remove spaces from email address');
    }

    return {
      isValid: false,
      message: 'Invalid email format',
      suggestions,
    };
  }

  return {
    isValid: true,
    message: 'Valid email address',
  };
}

// ============================================================================
// URL Validation
// ============================================================================

export function validateUrl(url: string): ValidationResult {
  try {
    const urlObj = new URL(url);

    return {
      isValid: true,
      message: 'Valid URL',
      details: {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
      },
    };
  } catch {
    const suggestions: string[] = [];

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      suggestions.push('URL should start with http:// or https://');
    }

    return {
      isValid: false,
      message: 'Invalid URL format',
      suggestions,
    };
  }
}

// ============================================================================
// Credit Card Validation (Luhn Algorithm)
// ============================================================================

export function validateCreditCard(cardNumber: string): ValidationResult {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Check if only digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Card number must contain only digits',
    };
  }

  // Check length (most cards are 13-19 digits)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return {
      isValid: false,
      message: 'Card number must be between 13 and 19 digits',
    };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  const isValid = sum % 10 === 0;

  // Detect card type
  let cardType = 'Unknown';
  if (/^4/.test(cleaned)) cardType = 'Visa';
  else if (/^5[1-5]/.test(cleaned)) cardType = 'Mastercard';
  else if (/^3[47]/.test(cleaned)) cardType = 'American Express';
  else if (/^6(?:011|5)/.test(cleaned)) cardType = 'Discover';

  return {
    isValid,
    message: isValid ? `Valid ${cardType} card number` : 'Invalid card number (failed Luhn check)',
    details: {
      cardType,
      length: cleaned.length,
    },
  };
}

// ============================================================================
// IBAN Validation
// ============================================================================

export function validateIBAN(iban: string): ValidationResult {
  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Check format (2 letters, 2 digits, up to 30 alphanumeric)
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Invalid IBAN format (should start with 2 letters and 2 digits)',
    };
  }

  // Check length (varies by country, but typically 15-34)
  if (cleaned.length < 15 || cleaned.length > 34) {
    return {
      isValid: false,
      message: 'Invalid IBAN length',
    };
  }

  // Move first 4 characters to end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  const numericString = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  // Calculate mod 97
  let remainder = numericString;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);
  }

  const isValid = parseInt(remainder, 10) % 97 === 1;

  return {
    isValid,
    message: isValid ? 'Valid IBAN' : 'Invalid IBAN (failed checksum)',
    details: {
      country: cleaned.slice(0, 2),
      checkDigits: cleaned.slice(2, 4),
      length: cleaned.length,
    },
  };
}

// ============================================================================
// Phone Number Validation
// ============================================================================

export function validatePhoneNumber(phone: string): ValidationResult {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, '');

  // Check if only digits remain
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Phone number contains invalid characters',
    };
  }

  // Check length (most phone numbers are 7-15 digits)
  if (cleaned.length < 7 || cleaned.length > 15) {
    return {
      isValid: false,
      message: 'Phone number must be between 7 and 15 digits',
    };
  }

  return {
    isValid: true,
    message: 'Valid phone number format',
    details: {
      digits: cleaned.length,
      formatted: phone,
    },
  };
}

// ============================================================================
// IP Address Validation
// ============================================================================

export function validateIPv4(ip: string): ValidationResult {
  const parts = ip.split('.');

  if (parts.length !== 4) {
    return {
      isValid: false,
      message: 'IPv4 address must have 4 octets',
    };
  }

  const isValid = parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });

  return {
    isValid,
    message: isValid ? 'Valid IPv4 address' : 'Invalid IPv4 address',
  };
}

export function validateIPv6(ip: string): ValidationResult {
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  const isValid = ipv6Regex.test(ip);

  return {
    isValid,
    message: isValid ? 'Valid IPv6 address' : 'Invalid IPv6 address',
  };
}

// ============================================================================
// UUID Validation
// ============================================================================

export function validateUUID(uuid: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(uuid);

  let version: number | undefined;
  if (isValid) {
    version = parseInt(uuid[14], 16);
  }

  return {
    isValid,
    message: isValid ? `Valid UUID v${version}` : 'Invalid UUID format',
    details: version ? { version } : undefined,
  };
}

// ============================================================================
// JSON Validation
// ============================================================================

export function validateJSON(str: string): ValidationResult {
  try {
    JSON.parse(str);
    return {
      isValid: true,
      message: 'Valid JSON',
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Invalid JSON',
      suggestions: [error instanceof Error ? error.message : 'Parse error'],
    };
  }
}
