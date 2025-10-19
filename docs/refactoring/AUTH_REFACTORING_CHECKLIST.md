# Authentication Refactoring Checklist

This checklist provides actionable tasks based on the [GitHub Authentication Audit](./GITHUB_AUTH_AUDIT.md).

## Phase 1: Critical Security & Testing (Week 1)

### Security Documentation
- [ ] Add comprehensive comments to `allowDangerousEmailAccountLinking` in `lib/auth/index.ts`
  - Explain why it's safe in current context
  - Document prerequisites (OAuth email verification)
  - Add warnings about adding unverified email/password signup
- [ ] Review and document all security assumptions in authentication flow
- [ ] Create security checklist for future auth changes

### Type Safety
- [ ] Replace `as any` in `lib/auth/index.ts` line 21 with proper `Adapter` type
- [ ] Replace `any` type in `lib/auth/account-linking.ts` line 60 with proper interface
- [ ] Create `lib/auth/types.ts` with shared authentication types:
  - `AuthUser` interface
  - `AuthSession` interface
  - `LoginContext` type
  - `OAuthProvider` interface
- [ ] Type the form data in `components/features/modals/login-modal.tsx`

### Unit Tests
- [ ] Create `lib/auth/__tests__/callbacks.test.ts`
  - Test signIn callback with various scenarios
  - Test jwt callback with user data and updates
  - Test session callback
- [ ] Create `lib/auth/__tests__/account-linking.test.ts`
  - Test linking new OAuth account
  - Test linking to existing user
  - Test updating user data from OAuth
  - Test error scenarios
- [ ] Create `lib/auth/__tests__/admin.test.ts`
  - Test isSuperAdmin with valid/invalid emails
  - Test checkSuperAdmin function
  - Test error handling
- [ ] Create `lib/api/__tests__/auth-middleware.test.ts`
  - Test withAuth with valid session
  - Test withAuth without session
  - Test withOptionalAuth

### E2E Test Fixes
- [ ] Audit all data-testid attributes in `components/features/modals/login-modal.tsx`
- [ ] Update `tests/e2e/authenticated/auth-flows.spec.ts` to match actual component structure
- [ ] Remove references to non-existent fields (signup-confirm-password, etc.)
- [ ] Add missing data-testid attributes to login modal

---

## Phase 2: Code Organization & Quality (Week 2)

### Refactor Authentication Module Structure
- [ ] Create `lib/auth/adapter.ts` with `createAuthAdapter()` function
- [ ] Create `lib/auth/providers.ts` with provider configurations
- [ ] Create `lib/auth/callbacks.ts` with NextAuth callbacks
- [ ] Create `lib/auth/constants.ts` with shared constants
- [ ] Update `lib/auth/index.ts` to import and assemble from new modules
- [ ] Remove dynamic `require()` usage

### Consolidate Email Normalization
- [ ] Ensure `lib/utils/email.ts` has `normalizeEmail()` function
- [ ] Update `lib/auth/index.ts` to use `normalizeEmail()`
- [ ] Update `app/api/auth/signup/route.ts` to use `normalizeEmail()`
- [ ] Update `components/features/modals/login-modal.tsx` to use `normalizeEmail()`
- [ ] Search codebase for other email normalization instances

### Standardize Password Hashing
- [ ] Create `lib/auth/password.ts` with:
  - `BCRYPT_ROUNDS` constant
  - `hashPassword()` function
  - `verifyPassword()` function
- [ ] Update `lib/auth/index.ts` to use new password utilities
- [ ] Update `app/api/auth/signup/route.ts` to use new password utilities

### Implement or Remove Unused Options
- [ ] Decide: Implement `requireEmailVerified` and `requireRole` in `withAuth`?
  - If yes: Implement the functionality
  - If no: Remove the unused options from the interface
- [ ] Update all usages of `withAuth` accordingly
- [ ] Add tests for new functionality if implemented

### Extract Constants
- [ ] Move login modal context messages to `lib/auth/constants.ts`
- [ ] Export `LOGIN_CONTEXTS` and `LoginContext` type
- [ ] Update `components/features/modals/login-modal.tsx` to import constants
- [ ] Update `hooks/use-login-modal.ts` to use `LoginContext` type

---

## Phase 3: Error Handling & Documentation (Week 3)

### Improve Error Handling
- [ ] Add try-catch to `linkOAuthAccount()` in `lib/auth/account-linking.ts`
- [ ] Add structured error logging with context
- [ ] Improve OAuth error handling in `components/features/modals/login-modal.tsx`
- [ ] Add `finally` block to reset loading state
- [ ] Improve error messages for production (hide infrastructure details)
- [ ] Update "Database not available" error message

### Add Error Context
- [ ] Add error context to all authentication-related API calls
- [ ] Ensure all errors are logged with sufficient context
- [ ] Add user-friendly error messages for common scenarios
- [ ] Create error message constants for consistency

### Documentation
- [ ] Create `docs/architecture/AUTHENTICATION.md` with:
  - Authentication flow diagrams
  - OAuth integration details
  - Session management strategy
  - Security considerations
  - Account linking process
  - Admin role system
- [ ] Add JSDoc comments to all functions in `lib/auth/index.ts`
- [ ] Add JSDoc comments to `linkOAuthAccount()` in `lib/auth/account-linking.ts`
- [ ] Add JSDoc comments to all functions in `lib/auth/admin.ts`
- [ ] Add JSDoc comments to `withAuth` and `withOptionalAuth` in `lib/api/utils.ts`
- [ ] Create README in `lib/auth/` explaining the authentication system

---

## Phase 4: Performance & Features (Optional)

### Performance Optimizations
- [ ] Add memoization to `UserMenu` component for user initials
- [ ] Add memoization to other session-dependent components
- [ ] Implement caching for `checkSuperAdmin()` function
- [ ] Review and optimize session refetch strategy
- [ ] Consider implementing session rotation

### Code Deduplication
- [ ] Create OAuth provider factory function
- [ ] Consolidate admin checking logic with shared helper
- [ ] Review codebase for other duplication patterns

### Missing Features (If Needed)
- [ ] Implement password reset functionality:
  - Add password reset request endpoint
  - Generate secure reset tokens
  - Send reset emails
  - Add reset password page
  - Implement token validation and password update
- [ ] Implement email verification:
  - Add emailVerified flag to User model
  - Send verification emails on signup
  - Add verification endpoint
  - Enforce verification for sensitive operations
- [ ] Implement session management UI:
  - Store session metadata in database
  - Add "Active Sessions" page in profile
  - Allow users to revoke individual sessions
  - Show last login time, device, location
- [ ] Add 2FA support (if required)

---

## Testing Checklist

### Unit Tests to Add
- [ ] `lib/auth/callbacks.test.ts` - All NextAuth callbacks
- [ ] `lib/auth/account-linking.test.ts` - OAuth account linking
- [ ] `lib/auth/admin.test.ts` - Admin role checking
- [ ] `lib/auth/password.test.ts` - Password hashing utilities
- [ ] `lib/api/auth-middleware.test.ts` - Auth middleware

### Integration Tests to Add
- [ ] Session expiry and refresh
- [ ] Concurrent login attempts
- [ ] Account linking edge cases
- [ ] Rate limiting on auth endpoints
- [ ] Token validation and refresh

### E2E Tests to Fix/Add
- [ ] Fix data-testid mismatches in auth-flows.spec.ts
- [ ] Add tests for password reset flow (if implemented)
- [ ] Add tests for email verification flow (if implemented)
- [ ] Add tests for session management UI (if implemented)

---

## Code Review Checklist

Before merging any authentication changes, verify:

- [ ] All new code has unit tests with >80% coverage
- [ ] All security implications are documented
- [ ] No `any` types are used
- [ ] All errors are properly handled and logged
- [ ] All functions have JSDoc comments
- [ ] No sensitive data is logged
- [ ] All database queries have error handling
- [ ] All API endpoints have rate limiting
- [ ] All user inputs are validated
- [ ] All passwords are properly hashed
- [ ] All sessions are properly validated
- [ ] All OAuth flows are secure
- [ ] All admin checks are properly implemented
- [ ] E2E tests pass
- [ ] No breaking changes to existing functionality

---

## Quick Reference: Files to Modify

### New Files to Create
- `lib/auth/types.ts` - Shared authentication types
- `lib/auth/adapter.ts` - Prisma adapter creation
- `lib/auth/providers.ts` - OAuth provider configurations
- `lib/auth/callbacks.ts` - NextAuth callbacks
- `lib/auth/constants.ts` - Shared constants
- `lib/auth/password.ts` - Password utilities
- `lib/auth/__tests__/` - Unit tests directory
- `docs/architecture/AUTHENTICATION.md` - Architecture documentation

### Existing Files to Modify
- `lib/auth/index.ts` - Refactor and split into modules
- `lib/auth/account-linking.ts` - Add error handling, improve types
- `lib/auth/admin.ts` - Add caching, consolidate logic
- `lib/api/utils.ts` - Implement or remove unused options
- `components/features/modals/login-modal.tsx` - Improve error handling, use constants
- `hooks/use-login-modal.ts` - Use shared types
- `tests/e2e/authenticated/auth-flows.spec.ts` - Fix data-testid mismatches

---

## Progress Tracking

### Phase 1 Progress: ☐ 0/20 tasks
### Phase 2 Progress: ☐ 0/15 tasks
### Phase 3 Progress: ☐ 0/12 tasks
### Phase 4 Progress: ☐ 0/10 tasks

**Total Progress: ☐ 0/57 tasks**

---

## Notes

- Prioritize Phase 1 (security and testing) before making structural changes
- Each phase can be done in a separate PR for easier review
- Consider creating feature flags for new functionality
- Keep backward compatibility in mind when refactoring
- Update this checklist as you complete tasks
- Add new tasks if you discover additional issues

---

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)

