/**
 * Unit tests for password utilities
 * Tests hashPassword, verifyPassword, and validatePasswordStrength functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../password';
import { PASSWORD_REQUIREMENTS } from '../constants';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(200);
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters', async () => {
      const password = '密码🔐测试';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('testpassword123', hash);

      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const password = '';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(true);
    });

    it('should reject empty password against non-empty hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });

    it('should handle special characters in verification', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in verification', async () => {
      const password = '密码🔐测试';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject invalid hash format', async () => {
      const password = 'testPassword123';
      const invalidHash = 'not-a-valid-hash';
      const isValid = await verifyPassword(password, invalidHash);

      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate password meeting minimum requirements', () => {
      const password = 'a'.repeat(PASSWORD_REQUIREMENTS.minLength);
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password below minimum length', () => {
      const password = 'a'.repeat(PASSWORD_REQUIREMENTS.minLength - 1);
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
      );
    });

    it('should reject password above maximum length', () => {
      const password = 'a'.repeat(PASSWORD_REQUIREMENTS.maxLength + 1);
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`
      );
    });

    it('should rate weak password correctly', () => {
      const password = 'password';
      const result = validatePasswordStrength(password);

      expect(result.strength).toBe('weak');
    });

    it('should rate medium password correctly', () => {
      const password = 'password123';
      const result = validatePasswordStrength(password);

      expect(result.strength).toBe('medium');
    });

    it('should rate strong password correctly', () => {
      const password = 'Password123!@#';
      const result = validatePasswordStrength(password);

      expect(result.strength).toBe('strong');
    });

    it('should handle empty password', () => {
      const password = '';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBe('weak');
    });

    it('should validate password with all character types', () => {
      const password = 'Abc123!@#xyz';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should handle unicode characters', () => {
      const password = '密码🔐测试123';
      const result = validatePasswordStrength(password);

      // Should be valid if meets length requirements
      expect(result.isValid).toBe(true);
    });

    it('should provide multiple errors for invalid password', () => {
      const password = 'ab'; // Too short
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate exact minimum length', () => {
      const password = 'a'.repeat(PASSWORD_REQUIREMENTS.minLength);
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
    });

    it('should validate exact maximum length', () => {
      const password = 'a'.repeat(PASSWORD_REQUIREMENTS.maxLength);
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Password Security', () => {
    it('should use timing-safe comparison', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      // Measure time for correct password
      const start1 = Date.now();
      await verifyPassword(password, hash);
      const time1 = Date.now() - start1;

      // Measure time for incorrect password
      const start2 = Date.now();
      await verifyPassword('wrongPassword', hash);
      const time2 = Date.now() - start2;

      // Times should be similar (within reasonable margin)
      // This is a basic check - bcrypt is timing-safe by design
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });

    it('should generate cryptographically secure hashes', async () => {
      const password = 'testPassword123';
      const hashes = await Promise.all([
        hashPassword(password),
        hashPassword(password),
        hashPassword(password),
      ]);

      // All hashes should be different (different salts)
      expect(new Set(hashes).size).toBe(3);

      // All should verify correctly
      const verifications = await Promise.all(hashes.map((hash) => verifyPassword(password, hash)));
      expect(verifications.every((v) => v === true)).toBe(true);
    });
  });
});
