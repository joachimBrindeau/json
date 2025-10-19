# Authentication Refactoring - Code Examples

This document provides concrete code examples for the most important refactoring opportunities identified in the audit.

---

## 1. Create Shared Type Definitions

### Current State
Types are scattered and some use `any`:

```typescript
// lib/auth/index.ts
adapter: PrismaAdapter(prisma) as any

// lib/auth/account-linking.ts
const updateData: any = {};
```

### Proposed Solution

**Create `lib/auth/types.ts`:**

```typescript
import type { User, Account } from '@prisma/client';
import type { Session } from 'next-auth';

/**
 * Authenticated user data structure
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified?: Date | null;
}

/**
 * Authentication session structure
 */
export interface AuthSession extends Session {
  user: AuthUser;
}

/**
 * Login modal context types
 */
export type LoginContext = 
  | 'library' 
  | 'save' 
  | 'share' 
  | 'expire' 
  | 'general' 
  | 'publish';

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  allowDangerousEmailAccountLinking?: boolean;
}

/**
 * User update data for OAuth account linking
 */
export interface UserUpdateData {
  image?: string;
  name?: string;
  emailVerified?: Date;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors?: string[];
}
```

**Update `lib/auth/account-linking.ts`:**

```typescript
import type { UserUpdateData } from './types';

export async function linkOAuthAccount(
  user: NextAuthUser,
  account: NextAuthAccount,
  prisma: PrismaClient
): Promise<string | null> {
  // ... existing logic ...

  // Replace: const updateData: any = {};
  const updateData: UserUpdateData = {};

  if (user.image) {
    updateData.image = user.image;
  }

  if (!existingUser.name && user.name) {
    updateData.name = user.name;
  }

  // ... rest of function
}
```

---

## 2. Refactor Prisma Adapter Creation

### Current State

```typescript
// lib/auth/index.ts
function getPrismaAdapter() {
  if (!config.database.url) {
    return { prisma: null, adapter: undefined };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require('@/lib/db');
  return {
    prisma,
    adapter: PrismaAdapter(prisma) as any
  };
}

const { prisma, adapter } = getPrismaAdapter();
```

### Proposed Solution

**Create `lib/auth/adapter.ts`:**

```typescript
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import type { Adapter } from 'next-auth/adapters';

/**
 * Creates the NextAuth adapter for database operations.
 * Returns undefined if database is not configured.
 * 
 * @returns Prisma adapter instance or undefined
 */
export function createAuthAdapter(): Adapter | undefined {
  if (!config.database.url) {
    return undefined;
  }
  
  return PrismaAdapter(prisma);
}

/**
 * Gets the Prisma client instance for auth operations.
 * Returns null if database is not configured.
 * 
 * @returns Prisma client or null
 */
export function getAuthPrisma() {
  if (!config.database.url) {
    return null;
  }
  
  return prisma;
}
```

**Update `lib/auth/index.ts`:**

```typescript
import { createAuthAdapter, getAuthPrisma } from './adapter';

const adapter = createAuthAdapter();
const prisma = getAuthPrisma();

export const authOptions: NextAuthOptions = {
  adapter,
  // ... rest of config
};
```

---

## 3. Consolidate Email Normalization

### Current State

Email normalization is duplicated across files:

```typescript
// lib/auth/index.ts
credentials.email.toLowerCase().trim()

// app/api/auth/signup/route.ts
const normalizedEmail = email.toLowerCase().trim();

// components/features/modals/login-modal.tsx
const email = normalizeEmail(formData.email);
```

### Proposed Solution

**Ensure `lib/utils/email.ts` exists:**

```typescript
/**
 * Normalizes an email address for consistent storage and comparison.
 * Converts to lowercase and trims whitespace.
 * 
 * @param email - The email address to normalize
 * @returns Normalized email address
 * 
 * @example
 * normalizeEmail('  User@Example.COM  ') // returns 'user@example.com'
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validates email format using a simple regex.
 * For production, consider using a library like validator.js
 * 
 * @param email - The email address to validate
 * @returns True if email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Update all files to use it:**

```typescript
// lib/auth/index.ts
import { normalizeEmail } from '@/lib/utils/email';

async authorize(credentials) {
  // ...
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(credentials.email) },
  });
  // ...
}

// app/api/auth/signup/route.ts
import { normalizeEmail } from '@/lib/utils/email';

const normalizedEmail = normalizeEmail(email);

// components/features/modals/login-modal.tsx
import { normalizeEmail } from '@/lib/utils/email';

const email = normalizeEmail(formData.email);
```

---

## 4. Standardize Password Hashing

### Current State

Password hashing is inconsistent:

```typescript
// app/api/auth/signup/route.ts
const hashedPassword = await bcrypt.hash(password, 12);

// lib/auth/index.ts
const isValid = await bcrypt.compare(credentials.password, user.password);
```

### Proposed Solution

**Create `lib/auth/password.ts`:**

```typescript
import bcrypt from 'bcryptjs';

/**
 * Number of salt rounds for bcrypt hashing.
 * Higher values are more secure but slower.
 * 12 rounds is a good balance for 2024.
 */
const BCRYPT_ROUNDS = 12;

/**
 * Minimum password length requirement
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Hashes a password using bcrypt.
 * 
 * @param password - Plain text password to hash
 * @returns Hashed password
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies a password against a hash.
 * 
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash
 * 
 * @example
 * const isValid = await verifyPassword('myPassword', storedHash);
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validates password strength.
 * 
 * @param password - Password to validate
 * @returns Validation result with errors if any
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

**Update usage:**

```typescript
// app/api/auth/signup/route.ts
import { hashPassword } from '@/lib/auth/password';

const hashedPassword = await hashPassword(password);

// lib/auth/index.ts
import { verifyPassword } from '@/lib/auth/password';

const isValid = await verifyPassword(credentials.password, user.password);
```

---

## 5. Extract Login Context Constants

### Current State

```typescript
// components/features/modals/login-modal.tsx
const contextMessages: Record<string, { title: string; description: string }> = {
  library: {
    title: 'Access Your Library',
    description: 'Sign in to view and manage your saved JSONs',
  },
  // ... more contexts
};
```

### Proposed Solution

**Add to `lib/auth/constants.ts`:**

```typescript
/**
 * Login modal context messages
 */
export const LOGIN_CONTEXTS = {
  library: {
    title: 'Access Your Library',
    description: 'Sign in to view and manage your saved JSONs',
  },
  save: {
    title: 'Save to Library',
    description: 'Sign in to save this JSON permanently to your library',
  },
  share: {
    title: 'Share Permanently',
    description: 'Sign in to create permanent share links that never expire',
  },
  expire: {
    title: 'Save Before It Expires',
    description: 'This JSON will expire soon. Sign in to save it permanently',
  },
  publish: {
    title: 'Publish to Community',
    description: 'Sign in to publish your JSON to the public community library',
  },
  general: {
    title: 'Sign in to JSON Viewer',
    description: 'Sign in to save your JSONs permanently and access advanced features',
  },
} as const;

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  REFETCH_INTERVAL: 5 * 60, // 5 minutes in seconds
  STRATEGY: 'jwt' as const,
} as const;

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
} as const;
```

**Update `lib/auth/types.ts`:**

```typescript
import { LOGIN_CONTEXTS } from './constants';

export type LoginContext = keyof typeof LOGIN_CONTEXTS;
```

**Update component:**

```typescript
// components/features/modals/login-modal.tsx
import { LOGIN_CONTEXTS } from '@/lib/auth/constants';
import type { LoginContext } from '@/lib/auth/types';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: LoginContext;
}

export function LoginModal({ open, onOpenChange, context = 'general' }: LoginModalProps) {
  const message = LOGIN_CONTEXTS[context];
  // ... rest of component
}
```

---

## 6. Improve Error Handling in Account Linking

### Current State

```typescript
// lib/auth/account-linking.ts
export async function linkOAuthAccount(
  user: NextAuthUser,
  account: NextAuthAccount,
  prisma: PrismaClient
): Promise<string | null> {
  // ... logic with no error handling
}
```

### Proposed Solution

```typescript
import { logger } from '@/lib/logger';
import type { UserUpdateData } from './types';

/**
 * Links an OAuth provider account to an existing user account.
 * 
 * This function is called during the OAuth sign-in flow to:
 * 1. Check if a user with the same email already exists
 * 2. Link the OAuth account to the existing user
 * 3. Update user profile with OAuth provider data (image, name)
 * 
 * @param user - The user object from the OAuth provider
 * @param account - The OAuth account details
 * @param prisma - Prisma client instance
 * @returns The existing user ID if linked, null otherwise
 * 
 * @throws {Error} If account linking fails
 */
export async function linkOAuthAccount(
  user: NextAuthUser,
  account: NextAuthAccount,
  prisma: PrismaClient
): Promise<string | null> {
  try {
    // Early returns for invalid inputs
    if (!account.provider || account.provider === 'credentials') {
      return null;
    }

    const email = user.email;
    if (!email) {
      logger.warn(
        { provider: account.provider },
        'OAuth user has no email, cannot link account'
      );
      return null;
    }

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!existingUser) {
      return null;
    }

    // Check if this provider is already linked
    const isLinked = existingUser.accounts.some(
      (acc) =>
        acc.provider === account.provider &&
        acc.providerAccountId === account.providerAccountId
    );

    if (!isLinked) {
      // Link the OAuth account to existing user
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });

      logger.info(
        {
          userId: existingUser.id,
          provider: account.provider,
          email,
        },
        'OAuth account linked to existing user'
      );
    }

    // Update user info with OAuth provider data
    const updateData: UserUpdateData = {};

    if (user.image) {
      updateData.image = user.image;
    }

    if (!existingUser.name && user.name) {
      updateData.name = user.name;
    }

    // Apply updates if any
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });

      logger.info(
        {
          userId: existingUser.id,
          updates: Object.keys(updateData),
        },
        'User profile updated from OAuth data'
      );
    }

    return existingUser.id;
  } catch (error) {
    logger.error(
      {
        err: error,
        provider: account.provider,
        email: user.email,
      },
      'Failed to link OAuth account'
    );
    
    // Re-throw to let NextAuth handle it
    throw new Error('Failed to link account. Please try again.');
  }
}
```

---

## 7. Add Security Documentation

### Current State

```typescript
GitHubProvider({
  clientId: config.auth.providers.github.clientId,
  clientSecret: config.auth.providers.github.clientSecret,
  allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
}),
```

### Proposed Solution

```typescript
/**
 * GitHub OAuth Provider Configuration
 * 
 * SECURITY NOTE: allowDangerousEmailAccountLinking
 * ================================================
 * This setting allows automatic account linking based on email address alone.
 * 
 * Why this is safe in our context:
 * 1. OAuth providers (GitHub/Google) verify email ownership before providing it
 * 2. We use the linkOAuthAccount function to safely merge accounts
 * 3. Users can only link accounts with verified emails from trusted providers
 * 4. We track all account linking operations in logs
 * 
 * IMPORTANT: If you add email/password signup without email verification,
 * this becomes a security vulnerability. An attacker could:
 * 1. Create an account with victim@example.com (unverified)
 * 2. Sign in with GitHub using victim@example.com (verified by GitHub)
 * 3. Gain access to the unverified account
 * 
 * Mitigation: Always verify emails before allowing account linking,
 * or disable this setting and implement manual account linking.
 * 
 * @see https://next-auth.js.org/configuration/providers/oauth#allowdangerousemailaccountlinking-option
 */
GitHubProvider({
  clientId: config.auth.providers.github.clientId,
  clientSecret: config.auth.providers.github.clientSecret,
  allowDangerousEmailAccountLinking: true,
}),
```

---

## 8. Consolidate Admin Checking Logic

### Current State

```typescript
// lib/auth/admin.ts
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return false;
    }

    return config.auth.superadminEmails.includes(userEmail);
  } catch (error) {
    logger.error({ err: error }, 'Failed to check superadmin status');
    return false;
  }
}

export function checkSuperAdmin(userEmail?: string | null): boolean {
  if (!userEmail) {
    return false;
  }
  return config.auth.superadminEmails.includes(userEmail);
}
```

### Proposed Solution

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

/**
 * Cache for superadmin checks to avoid repeated array lookups
 */
const adminCache = new Map<string, { isAdmin: boolean; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Core function to check if an email is in the superadmin list.
 * Uses caching to improve performance.
 * 
 * @param email - Email address to check
 * @returns True if email is in superadmin list
 */
function isEmailSuperAdmin(email: string): boolean {
  // Check cache first
  const cached = adminCache.get(email);
  if (cached && cached.expires > Date.now()) {
    return cached.isAdmin;
  }

  // Check against config
  const isAdmin = config.auth.superadminEmails.includes(email);

  // Cache the result
  adminCache.set(email, {
    isAdmin,
    expires: Date.now() + CACHE_TTL,
  });

  return isAdmin;
}

/**
 * Checks if the current session user is a superadmin.
 * This is an async function that retrieves the session.
 * 
 * @returns Promise resolving to true if user is superadmin
 * 
 * @example
 * const isAdmin = await isSuperAdmin();
 * if (isAdmin) {
 *   // Allow admin action
 * }
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return false;
    }

    return isEmailSuperAdmin(userEmail);
  } catch (error) {
    logger.error({ err: error }, 'Failed to check superadmin status');
    return false;
  }
}

/**
 * Synchronous check for client components.
 * Use this only when you already have the user email.
 * 
 * @param userEmail - Email address to check
 * @returns True if email is superadmin
 * 
 * @example
 * const isAdmin = checkSuperAdmin(session?.user?.email);
 */
export function checkSuperAdmin(userEmail?: string | null): boolean {
  if (!userEmail) {
    return false;
  }
  return isEmailSuperAdmin(userEmail);
}

/**
 * Throws an error if the current user is not a superadmin.
 * Use this in API routes that require superadmin access.
 * 
 * @throws {Error} If user is not a superadmin
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   await requireSuperAdmin();
 *   // Admin-only logic here
 * }
 */
export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Superadmin access required');
  }
}

/**
 * Clears the admin check cache.
 * Useful for testing or when superadmin list changes.
 */
export function clearAdminCache(): void {
  adminCache.clear();
}
```

---

## Summary

These examples demonstrate the key refactoring patterns:

1. **Type Safety** - Replace `any` with proper types
2. **Code Organization** - Split large files into focused modules
3. **Consolidation** - Remove duplication with shared utilities
4. **Error Handling** - Add proper error handling and logging
5. **Documentation** - Add comprehensive JSDoc comments
6. **Performance** - Add caching where appropriate
7. **Security** - Document security implications

Each example includes:
- ✅ The current problematic code
- ✅ The proposed solution
- ✅ JSDoc documentation
- ✅ Usage examples
- ✅ Security considerations where relevant

For complete implementation details, see:
- [Full Audit Report](./GITHUB_AUTH_AUDIT.md)
- [Refactoring Checklist](./AUTH_REFACTORING_CHECKLIST.md)
- [Executive Summary](./AUTH_AUDIT_SUMMARY.md)

