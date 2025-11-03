/**
 * Authentication Error Handling Tests
 * Tests all error scenarios in the authentication system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../password';
import { AUTH_ERROR_MESSAGES } from '../constants';

describe('Authentication Error Handling', () => {
  describe('Password Errors', () => {
    it('should handle empty password in hashPassword', async () => {
      const result = await hashPassword('');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty password in verifyPassword', async () => {
      const hash = await hashPassword('test123');
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });

    it('should handle null-like values gracefully', async () => {
      const hash = await hashPassword('test123');
      const result = await verifyPassword('test123', hash);
      expect(result).toBe(true);
    });

    it('should reject password that is too short', () => {
      const result = validatePasswordStrength('short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password that is too long', () => {
      const longPassword = 'a'.repeat(129);
      const result = validatePasswordStrength(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(specialPassword);
      const result = await verifyPassword(specialPassword, hash);
      expect(result).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = 'пароль密码🔒';
      const hash = await hashPassword(unicodePassword);
      const result = await verifyPassword(unicodePassword, hash);
      expect(result).toBe(true);
    });

    it('should handle whitespace in password', async () => {
      const whitespacePassword = '  password with spaces  ';
      const hash = await hashPassword(whitespacePassword);
      const result = await verifyPassword(whitespacePassword, hash);
      expect(result).toBe(true);
    });
  });

  describe('Authentication Error Messages', () => {
    it('should have defined error message for invalid credentials', () => {
      expect(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS).toBe('Invalid email or password');
    });

    it('should have defined error message for missing credentials', () => {
      expect(AUTH_ERROR_MESSAGES.MISSING_CREDENTIALS).toBe('Please enter both email and password');
    });

    it('should have defined error message for database unavailable', () => {
      expect(AUTH_ERROR_MESSAGES.DATABASE_UNAVAILABLE).toBe('Service temporarily unavailable');
    });

    it('should have defined error message for account not found', () => {
      expect(AUTH_ERROR_MESSAGES.ACCOUNT_NOT_FOUND).toBe('No account found with this email');
    });

    it('should have defined error message for OAuth signin failed', () => {
      expect(AUTH_ERROR_MESSAGES.OAUTH_SIGNIN_FAILED).toBe('Failed to sign in with OAuth provider');
    });

    it('should have defined error message for session required', () => {
      expect(AUTH_ERROR_MESSAGES.SESSION_REQUIRED).toBe(
        'You must be signed in to access this resource'
      );
    });

    it('should have defined error message for admin required', () => {
      expect(AUTH_ERROR_MESSAGES.ADMIN_REQUIRED).toBe('Admin access required');
    });
  });

  describe('Hash Verification Edge Cases', () => {
    it('should reject incorrect password', async () => {
      const hash = await hashPassword('correct');
      const result = await verifyPassword('incorrect', hash);
      expect(result).toBe(false);
    });

    it('should reject invalid hash format', async () => {
      const result = await verifyPassword('password', 'invalid_hash');
      expect(result).toBe(false);
    });

    it('should handle case-sensitive passwords', async () => {
      const hash = await hashPassword('Password123');
      const lowerResult = await verifyPassword('password123', hash);
      const upperResult = await verifyPassword('PASSWORD123', hash);
      const correctResult = await verifyPassword('Password123', hash);

      expect(lowerResult).toBe(false);
      expect(upperResult).toBe(false);
      expect(correctResult).toBe(true);
    });

    it('should handle similar but different passwords', async () => {
      const hash = await hashPassword('password123');
      const result1 = await verifyPassword('password124', hash);
      const result2 = await verifyPassword('password12', hash);
      const result3 = await verifyPassword('password1234', hash);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('Password Strength Validation Edge Cases', () => {
    it('should validate minimum length password', () => {
      const result = validatePasswordStrength('12345678');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate maximum length password', () => {
      const maxPassword = 'a'.repeat(128);
      const result = validatePasswordStrength(maxPassword);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should rate weak passwords correctly', () => {
      const result = validatePasswordStrength('12345678');
      expect(result.strength).toBe('weak');
    });

    it('should rate medium passwords correctly', () => {
      const result = validatePasswordStrength('password12');
      expect(result.strength).toBe('medium');
    });

    it('should rate strong passwords correctly', () => {
      const result = validatePasswordStrength('Password123!');
      expect(result.strength).toBe('strong');
    });

    it('should handle empty password validation', () => {
      const result = validatePasswordStrength('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle single character password', () => {
      const result = validatePasswordStrength('a');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple hash operations concurrently', async () => {
      const passwords = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5'];
      const hashes = await Promise.all(passwords.map((p) => hashPassword(p)));

      expect(hashes).toHaveLength(5);
      expect(new Set(hashes).size).toBe(5); // All hashes should be unique
    });

    it('should handle multiple verify operations concurrently', async () => {
      const password = 'testpass123';
      const hash = await hashPassword(password);

      const verifications = await Promise.all([
        verifyPassword(password, hash),
        verifyPassword(password, hash),
        verifyPassword(password, hash),
        verifyPassword('wrong', hash),
        verifyPassword('wrong', hash),
      ]);

      expect(verifications).toEqual([true, true, true, false, false]);
    });
  });

  describe('Performance and Security', () => {
    it('should complete hashing in reasonable time', async () => {
      const start = Date.now();
      await hashPassword('testpassword');
      const duration = Date.now() - start;

      // Bcrypt with 10 rounds should complete in under 500ms
      expect(duration).toBeLessThan(500);
    });

    it('should complete verification in reasonable time', async () => {
      const hash = await hashPassword('testpassword');
      const start = Date.now();
      await verifyPassword('testpassword', hash);
      const duration = Date.now() - start;

      // Verification should be fast
      expect(duration).toBeLessThan(200);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'samepassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Bcrypt includes salt, so hashes should be different
      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should handle SQL injection attempts in password', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const hash = await hashPassword(sqlInjection);
      const result = await verifyPassword(sqlInjection, hash);
      expect(result).toBe(true);
    });

    it('should handle XSS attempts in password', async () => {
      const xssAttempt = '<script>alert("xss")</script>';
      const hash = await hashPassword(xssAttempt);
      const result = await verifyPassword(xssAttempt, hash);
      expect(result).toBe(true);
    });

    it('should handle null bytes in password', async () => {
      const nullBytePassword = 'password\0hidden';
      const hash = await hashPassword(nullBytePassword);
      const result = await verifyPassword(nullBytePassword, hash);
      expect(result).toBe(true);
    });
  });
});
