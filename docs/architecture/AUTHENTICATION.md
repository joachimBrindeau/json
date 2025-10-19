# Authentication Architecture

**Last Updated**: 2025-10-18  
**Version**: 2.0 (Post-Refactoring)

---

## Overview

The JSON Viewer application uses **NextAuth.js v4** for authentication with support for:
- **OAuth Providers**: GitHub, Google
- **Credentials**: Email/password authentication
- **Session Strategy**: JWT-based (no database sessions)
- **Account Linking**: Automatic OAuth account linking for verified emails

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Modal  │  │  User Menu   │  │ Auth Guards  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      NextAuth.js Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              lib/auth/index.ts (Main Config)         │   │
│  │  - Providers (OAuth + Credentials)                   │   │
│  │  - Callbacks (signIn, jwt, session)                  │   │
│  │  - Session config (JWT, 30 days)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────┬────────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────┐
│   OAuth Providers    │          │   Credentials Auth   │
│  - GitHub            │          │  - Email/Password    │
│  - Google            │          │  - bcrypt hashing    │
│  (Email verified)    │          │  - Database lookup   │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                  │
           └──────────────┬───────────────────┘
                          ▼
                ┌──────────────────────┐
                │   Account Linking    │
                │  (lib/auth/          │
                │   account-linking.ts)│
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   Prisma Database    │
                │  - User              │
                │  - Account           │
                │  - Session (unused)  │
                └──────────────────────┘
```

---

## Module Structure

### Core Modules

#### `lib/auth/index.ts`
Main NextAuth configuration file.

**Exports**:
- `authOptions: NextAuthOptions` - NextAuth configuration object

**Dependencies**:
- `lib/auth/adapter.ts` - Prisma adapter creation
- `lib/auth/providers.ts` - OAuth provider configs
- `lib/auth/callbacks.ts` - NextAuth callbacks
- `lib/auth/constants.ts` - Shared constants
- `lib/auth/password.ts` - Password utilities

#### `lib/auth/adapter.ts`
Prisma adapter creation for NextAuth.

**Exports**:
- `createAuthAdapter()` - Creates Prisma adapter or undefined
- `getPrismaClient()` - Gets Prisma client or null

**Purpose**: Conditional database adapter initialization based on config.

#### `lib/auth/providers.ts`
OAuth provider configurations.

**Exports**:
- `githubProvider` - GitHub OAuth provider config
- `googleProvider` - Google OAuth provider config

**Security**: Both providers use `allowDangerousEmailAccountLinking: true` which is safe because:
1. OAuth providers verify email ownership
2. No unverified email/password signup exists
3. Account linking only for OAuth (not credentials)

#### `lib/auth/callbacks.ts`
NextAuth callback functions.

**Exports**:
- `authCallbacks` - Object with signIn, jwt, session callbacks

**Responsibilities**:
- **signIn**: Track login timestamp, link OAuth accounts
- **jwt**: Populate token with user data, handle updates
- **session**: Populate session from JWT

#### `lib/auth/constants.ts`
Shared authentication constants.

**Exports**:
- `SESSION_CONFIG` - Session strategy and maxAge
- `PASSWORD_REQUIREMENTS` - Password validation rules
- `BCRYPT_ROUNDS` - Password hashing rounds (10)
- `LOGIN_CONTEXT_MESSAGES` - Login modal messages
- `OAUTH_PROVIDERS` - Provider name constants
- `AUTH_ERROR_MESSAGES` - Error message constants

#### `lib/auth/password.ts`
Password hashing and validation utilities.

**Exports**:
- `hashPassword(password)` - Hash password with bcrypt
- `verifyPassword(password, hash)` - Verify password
- `validatePasswordStrength(password)` - Validate password strength

#### `lib/auth/account-linking.ts`
OAuth account linking logic.

**Exports**:
- `linkOAuthAccount(user, account, prisma)` - Link OAuth to existing user

**Purpose**: Automatically link OAuth accounts to existing users with same verified email.

#### `lib/auth/admin.ts`
Admin role checking functions.

**Exports**:
- `isSuperAdmin()` - Async server-side admin check
- `checkSuperAdmin(email)` - Sync client-side admin check
- `requireSuperAdmin()` - Throws if not admin

**Configuration**: Admin emails defined in `SUPERADMIN_EMAILS` environment variable.

#### `lib/auth/types.ts`
TypeScript type definitions for authentication.

**Exports**:
- `AuthUser`, `AuthSession`, `LoginContext`
- `UserUpdateData`, `LoginFormData`, `SignupFormData`
- `PasswordValidationResult`, `AuthError`
- `SessionUser`, `ExtendedJWT`, `AccountLinkingResult`

---

## Authentication Flow

### 1. OAuth Sign-In (GitHub/Google)

```
User clicks "Sign in with GitHub"
  ↓
NextAuth redirects to GitHub OAuth
  ↓
User authorizes on GitHub
  ↓
GitHub redirects back with code
  ↓
NextAuth exchanges code for tokens
  ↓
signIn callback triggered
  ├─ Track lastLoginAt timestamp
  ├─ Check if user exists with same email
  │  └─ If yes: Link OAuth account to existing user
  └─ Update user profile (image, name)
  ↓
jwt callback triggered
  └─ Populate JWT token with user data
  ↓
session callback triggered
  └─ Populate session from JWT
  ↓
User is signed in
```

### 2. Credentials Sign-In (Email/Password)

```
User enters email and password
  ↓
CredentialsProvider.authorize() called
  ├─ Normalize email (lowercase + trim)
  ├─ Look up user in database
  ├─ Verify password with bcrypt
  └─ Return user object or throw error
  ↓
signIn callback triggered
  └─ Track lastLoginAt timestamp
  ↓
jwt callback triggered
  └─ Populate JWT token with user data
  ↓
session callback triggered
  └─ Populate session from JWT
  ↓
User is signed in
```

### 3. Sign-Up (Email/Password)

```
User fills signup form
  ↓
POST /api/auth/signup
  ├─ Validate input (Zod schema)
  ├─ Normalize email
  ├─ Check if user exists
  ├─ Hash password (bcrypt, 10 rounds)
  └─ Create user in database
  ↓
User signs in with credentials
```

---

## Session Management

### Strategy: JWT

**Configuration**:
```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**JWT Token Structure**:
```typescript
{
  id: string;        // User ID
  email: string;     // User email
  name: string;      // User name
  image: string;     // Profile image URL
  iat: number;       // Issued at
  exp: number;       // Expires at
}
```

**Session Object Structure**:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
  },
  expires: string;   // ISO 8601 date
}
```

### Session Refresh

Sessions are automatically refreshed on:
- Page navigation (client-side)
- API calls with `getServerSession()`
- Manual trigger with `update()` from `useSession()`

**Profile Update Flow**:
```typescript
// Client-side
await update(); // Triggers jwt callback with trigger: 'update'

// Server-side (jwt callback)
if (trigger === 'update') {
  // Fetch fresh user data from database
  const dbUser = await prisma.user.findUnique(...);
  // Update token with fresh data
}
```

---

## Security Considerations

### 1. Email Verification

**Current State**: OAuth providers verify emails, credentials do not.

**Implications**:
- OAuth sign-in is safe (GitHub/Google verify emails)
- Credentials sign-up does NOT verify emails
- Account linking is safe because only OAuth can trigger it

**Future Enhancement**: Add email verification for credentials signup.

### 2. Password Security

**Hashing**: bcrypt with 10 rounds
**Requirements**: Minimum 8 characters (configurable)
**Storage**: Hashed passwords only, never plain text

### 3. Session Security

**JWT Signing**: Uses `NEXTAUTH_SECRET` environment variable
**Token Expiry**: 30 days
**Revocation**: Not supported (JWT limitation)

**Mitigation**:
- Short session lifetime for sensitive operations
- Consider database sessions for admin accounts
- Implement session rotation for sensitive actions

### 4. Admin Access

**Control**: Environment variable whitelist (`SUPERADMIN_EMAILS`)
**Validation**: Server-side only (never trust client)
**Logging**: Admin actions should be logged (not yet implemented)

---

## API Routes

### Authentication Endpoints

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler
- `POST /api/auth/signup` - User registration

### Protected Routes

Use `withAuth` middleware:
```typescript
import { withAuth } from '@/lib/api/utils';

export const GET = withAuth(async (req, session) => {
  // session is guaranteed to exist
  return Response.json({ userId: session.user.id });
});
```

### Optional Auth Routes

Use `withOptionalAuth` middleware:
```typescript
import { withOptionalAuth } from '@/lib/api/utils';

export const GET = withOptionalAuth(async (req, session) => {
  // session may be null
  if (session) {
    // Authenticated user
  } else {
    // Anonymous user
  }
});
```

---

## Testing

### Unit Tests

Located in `lib/auth/__tests__/`:
- `callbacks.test.ts` - NextAuth callbacks
- `account-linking.test.ts` - OAuth account linking
- `admin.test.ts` - Admin role checking
- `lib/api/__tests__/auth-middleware.test.ts` - Auth middleware

### E2E Tests

Located in `tests/e2e/`:
- Authentication flows (login, signup, logout)
- OAuth provider integration
- Protected route access
- Session persistence

---

## Environment Variables

Required:
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - Application URL
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

Optional:
- `SUPERADMIN_EMAILS` - Comma-separated admin emails
- `DATABASE_URL` - PostgreSQL connection string (for Prisma)

---

## Future Enhancements

### Planned

1. **Email Verification** (Phase 4)
   - Send verification email on signup
   - Verify email before allowing sensitive operations
   - Add `emailVerified` flag to User model

2. **Password Reset** (Phase 4)
   - Request password reset endpoint
   - Send reset email with token
   - Reset password with valid token

3. **Session Management UI** (Phase 4)
   - View active sessions
   - Revoke individual sessions
   - Display session metadata (device, location, time)

### Considerations

1. **Session Rotation**
   - Implement automatic session rotation
   - Refresh tokens every 7 days
   - Force re-authentication for sensitive operations

2. **Two-Factor Authentication**
   - TOTP-based 2FA
   - Backup codes
   - SMS/Email fallback

3. **OAuth Provider Expansion**
   - Microsoft
   - Apple
   - LinkedIn

---

## Troubleshooting

### Common Issues

**Issue**: "Database not available" error
**Solution**: Check `DATABASE_URL` environment variable

**Issue**: OAuth redirect fails
**Solution**: Verify `NEXTAUTH_URL` matches your domain

**Issue**: Session not persisting
**Solution**: Check `NEXTAUTH_SECRET` is set and consistent

**Issue**: Admin access not working
**Solution**: Verify email is in `SUPERADMIN_EMAILS` environment variable

---

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Security Documentation](../security/AUTHENTICATION_SECURITY.md)
- [Security Checklist](../security/AUTH_CHANGE_CHECKLIST.md)
- [Refactoring Progress](../../AUTHENTICATION_REFACTORING_PROGRESS.md)

