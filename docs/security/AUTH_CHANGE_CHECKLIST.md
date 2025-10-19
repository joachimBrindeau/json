# Authentication Change Security Checklist

**Purpose**: Ensure all authentication changes maintain security standards  
**Usage**: Complete this checklist for EVERY authentication-related change  
**Review**: Required before merging any auth-related PR

---

## Pre-Change Assessment

### Understanding Current State

- [ ] I have read `docs/security/AUTHENTICATION_SECURITY.md`
- [ ] I understand the current security assumptions
- [ ] I understand which assumptions my change affects
- [ ] I have identified potential security impacts

### Change Classification

**What type of change is this?** (Check all that apply)

- [ ] New authentication provider (OAuth, SAML, etc.)
- [ ] New authentication method (email/password signup, magic link, etc.)
- [ ] Changes to account linking logic
- [ ] Changes to session management
- [ ] Changes to password handling
- [ ] Changes to admin/role checking
- [ ] Changes to authentication callbacks
- [ ] Changes to authentication middleware
- [ ] Other: _______________

---

## Security Requirements

### Critical Security Controls

**These MUST be maintained for ALL changes:**

- [ ] **OAuth Email Verification**: All OAuth providers verify email ownership
- [ ] **No Unverified Signup**: No email/password signup without email verification
- [ ] **OAuth-Only Linking**: Account linking only for OAuth providers (not credentials)
- [ ] **Password Hashing**: All passwords hashed with bcrypt (10+ rounds)
- [ ] **Email Normalization**: All emails normalized (lowercase + trim)
- [ ] **Session Security**: JWT strategy with secure secret

### Code Quality

- [ ] No `any` types in authentication code
- [ ] All functions have proper TypeScript types
- [ ] All security-critical code has comments explaining why it's safe
- [ ] Error messages don't leak sensitive information
- [ ] All user inputs are validated and sanitized

### Authentication Provider Changes

**If adding/modifying OAuth provider:**

- [ ] Provider verifies email ownership
- [ ] Provider documentation reviewed for security best practices
- [ ] `allowDangerousEmailAccountLinking` only used if email is verified
- [ ] Security comment added explaining why linking is safe
- [ ] Provider configuration uses environment variables (no hardcoded secrets)

**If adding email/password signup:**

- [ ] Email verification implemented FIRST
- [ ] `allowDangerousEmailAccountLinking` removed OR
- [ ] Account linking only for verified emails
- [ ] Password strength requirements enforced
- [ ] Rate limiting implemented
- [ ] Security documentation updated

### Account Linking Changes

**If modifying account linking logic:**

- [ ] Only OAuth providers can trigger linking (not credentials)
- [ ] Email match validated before linking
- [ ] Existing user data preserved
- [ ] No data leakage between accounts
- [ ] Security assumptions documented in code comments

### Session Management Changes

**If modifying session logic:**

- [ ] Session expiry time is reasonable (current: 30 days)
- [ ] JWT secret is secure and from environment variable
- [ ] Session data doesn't include sensitive information
- [ ] Session strategy documented (JWT vs database)

### Password Handling Changes

**If modifying password logic:**

- [ ] bcrypt used for hashing (not MD5, SHA1, etc.)
- [ ] Minimum 10 rounds for bcrypt
- [ ] Passwords never logged or exposed in errors
- [ ] Password comparison uses timing-safe comparison (bcrypt.compare)
- [ ] Password strength requirements enforced

### Admin/Role Changes

**If modifying admin/role logic:**

- [ ] Admin access controlled by environment variable
- [ ] No hardcoded admin emails in code
- [ ] Admin checks use server-side validation (not client-side only)
- [ ] Admin actions logged for audit trail

---

## Testing Requirements

### Unit Tests

- [ ] Unit tests added for new authentication logic
- [ ] Tests cover success cases
- [ ] Tests cover failure cases
- [ ] Tests cover edge cases
- [ ] Tests cover security scenarios (invalid inputs, malicious data)
- [ ] All tests pass locally

### E2E Tests

- [ ] E2E tests added for new authentication flows
- [ ] Tests cover complete user journeys
- [ ] Tests verify security controls
- [ ] Tests use proper test data (not production data)
- [ ] All tests pass locally

### Security Testing

- [ ] Tested with invalid/malicious inputs
- [ ] Tested with missing required fields
- [ ] Tested with SQL injection attempts (if applicable)
- [ ] Tested with XSS attempts (if applicable)
- [ ] Tested with CSRF attempts (if applicable)
- [ ] Tested session expiry behavior
- [ ] Tested concurrent session behavior

### Manual Testing

- [ ] Tested in development environment
- [ ] Tested in staging environment (if available)
- [ ] Tested with different user roles
- [ ] Tested error scenarios
- [ ] Tested with different browsers (if UI change)

---

## Documentation Requirements

### Code Documentation

- [ ] Security-critical code has comments explaining why it's safe
- [ ] All functions have JSDoc comments
- [ ] Complex logic has inline comments
- [ ] Security assumptions documented in code

### Security Documentation

- [ ] `docs/security/AUTHENTICATION_SECURITY.md` updated
- [ ] New security assumptions documented
- [ ] Threat model updated (if applicable)
- [ ] Known limitations updated (if applicable)
- [ ] Emergency procedures updated (if applicable)

### Architecture Documentation

- [ ] `docs/architecture/AUTHENTICATION.md` updated (if exists)
- [ ] Flow diagrams updated (if applicable)
- [ ] Integration documentation updated (if applicable)

### User Documentation

- [ ] User-facing documentation updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Migration guide created (if breaking change)

---

## Review Requirements

### Code Review

- [ ] Code reviewed by at least one other developer
- [ ] Code reviewed by security-aware developer (if available)
- [ ] All review comments addressed
- [ ] No unresolved security concerns

### Security Review

- [ ] Reviewed against OWASP Top 10
- [ ] Reviewed against this security checklist
- [ ] Reviewed against `docs/security/AUTHENTICATION_SECURITY.md`
- [ ] No new security vulnerabilities introduced

### Architecture Review

- [ ] Change aligns with overall architecture
- [ ] No unnecessary complexity added
- [ ] Performance impact considered
- [ ] Scalability impact considered

---

## Deployment Requirements

### Pre-Deployment

- [ ] All tests pass in CI/CD pipeline
- [ ] Staging environment tested
- [ ] Environment variables configured correctly
- [ ] Database migrations tested (if applicable)
- [ ] Rollback plan documented

### Deployment

- [ ] HTTPS enabled in production
- [ ] JWT secret is secure and unique
- [ ] Environment variables set correctly
- [ ] Database migrations applied (if applicable)
- [ ] Monitoring configured for new endpoints

### Post-Deployment

- [ ] Smoke tests pass in production
- [ ] Authentication flows tested in production
- [ ] Error rates monitored
- [ ] Performance metrics monitored
- [ ] User feedback monitored

---

## Risk Assessment

### Security Risk Level

**What is the security risk level of this change?**

- [ ] **Critical**: Changes core security assumptions (e.g., adding unverified signup)
- [ ] **High**: Modifies authentication logic (e.g., account linking, password handling)
- [ ] **Medium**: Adds new authentication method (e.g., new OAuth provider)
- [ ] **Low**: Minor changes (e.g., UI updates, logging improvements)

### Additional Review Required

**If Critical or High risk:**

- [ ] Security team review completed
- [ ] Penetration testing completed (if available)
- [ ] Security audit completed (if available)

**If Medium risk:**

- [ ] Senior developer review completed
- [ ] Security checklist fully completed

**If Low risk:**

- [ ] Standard code review completed
- [ ] Security checklist reviewed

---

## Sign-Off

### Developer

- **Name**: _______________
- **Date**: _______________
- **Confirmation**: I have completed this checklist and confirm all requirements are met

### Reviewer

- **Name**: _______________
- **Date**: _______________
- **Confirmation**: I have reviewed this change and confirm it meets security standards

### Security Review (if required)

- **Name**: _______________
- **Date**: _______________
- **Confirmation**: I have reviewed this change from a security perspective and approve

---

## Common Pitfalls to Avoid

### ❌ Don't Do This

1. **Don't add email/password signup without email verification**
   - Risk: Account takeover via `allowDangerousEmailAccountLinking`

2. **Don't use `any` types in authentication code**
   - Risk: Type safety violations, runtime errors

3. **Don't hardcode secrets or admin emails**
   - Risk: Security breach, difficult to rotate

4. **Don't log passwords or tokens**
   - Risk: Credential leakage

5. **Don't use weak password hashing (MD5, SHA1)**
   - Risk: Password cracking

6. **Don't skip email normalization**
   - Risk: Duplicate accounts, case-sensitive login

7. **Don't allow account linking for credentials provider**
   - Risk: Account hijacking

8. **Don't expose detailed error messages to users**
   - Risk: Information leakage

### ✅ Do This Instead

1. **Implement email verification before adding signup**
   - Benefit: Prevents account takeover

2. **Use proper TypeScript types**
   - Benefit: Type safety, better IDE support

3. **Use environment variables for secrets**
   - Benefit: Easy rotation, secure storage

4. **Use structured logging without sensitive data**
   - Benefit: Debugging without security risk

5. **Use bcrypt with 10+ rounds**
   - Benefit: Secure password storage

6. **Normalize emails (lowercase + trim)**
   - Benefit: Consistent user experience

7. **Only link OAuth accounts**
   - Benefit: Secure account linking

8. **Use generic error messages for users**
   - Benefit: Security without usability loss

---

## Quick Reference

### Security Contacts

- **Security Team**: [Add contact info]
- **On-Call Engineer**: [Add contact info]
- **Security Incident Response**: [Add process link]

### Documentation Links

- [Authentication Security](./AUTHENTICATION_SECURITY.md)
- [Architecture Documentation](../architecture/AUTHENTICATION.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Tools

- **Password Strength Checker**: [Add tool link]
- **Security Scanner**: [Add tool link]
- **Dependency Checker**: `npm audit`

---

**Checklist Version**: 1.0  
**Last Updated**: 2025-10-18  
**Next Review**: 2026-01-18

