# Authentication Security Documentation

**Last Updated**: 2025-10-18  
**Status**: Active  
**Review Frequency**: Quarterly or before major auth changes

---

## Table of Contents

1. [Security Assumptions](#security-assumptions)
2. [Threat Model](#threat-model)
3. [Security Controls](#security-controls)
4. [Known Limitations](#known-limitations)
5. [Security Checklist](#security-checklist)

---

## Security Assumptions

### Critical Assumptions

These assumptions are **CRITICAL** to the security of the authentication system. If any of these assumptions become invalid, the security model breaks down.

#### 1. OAuth Provider Email Verification

**Assumption**: GitHub and Google verify email ownership before providing access.

**Why Critical**: We use `allowDangerousEmailAccountLinking: true` which automatically links OAuth accounts with the same email. If an OAuth provider doesn't verify emails, an attacker could:
1. Create a GitHub/Google account with victim's email (unverified)
2. Sign in to our app with that OAuth account
3. Gain access to victim's existing account

**Verification**:
- ✅ GitHub: Requires email verification for primary email
- ✅ Google: Requires email verification for all accounts

**Monitoring**: Review OAuth provider documentation quarterly for changes to email verification policies.

---

#### 2. No Unverified Email/Password Signup

**Assumption**: Users cannot create accounts with email/password without email verification.

**Current State**: ✅ SAFE - No email/password signup endpoint exists. Users can only:
- Sign in with existing email/password (created by admin)
- Sign in with OAuth (GitHub, Google)

**Why Critical**: If we add email/password signup without email verification:
1. Attacker creates account with victim's email
2. Victim tries to sign in with OAuth
3. `allowDangerousEmailAccountLinking` links OAuth to attacker's account
4. Attacker gains access to victim's OAuth account

**Action Required Before Adding Signup**:
- [ ] Implement email verification system
- [ ] Remove `allowDangerousEmailAccountLinking` OR
- [ ] Only link accounts with verified emails

---

#### 3. OAuth-Only Account Linking

**Assumption**: Account linking only happens for OAuth providers, not credentials.

**Implementation**: See `lib/auth/index.ts` lines 107-112:
```typescript
if (prisma && account?.provider && account.provider !== 'credentials') {
  const existingUserId = await linkOAuthAccount(user, account, prisma);
  // ...
}
```

**Why Critical**: Prevents credentials-based account hijacking.

**Verification**: Code review required for any changes to signIn callback.

---

#### 4. Session Strategy: JWT

**Assumption**: Sessions use JWT strategy, not database sessions.

**Current State**: ✅ Configured in `lib/auth/index.ts`:
```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**Security Implications**:
- ✅ No database queries on every request (performance)
- ⚠️ Cannot revoke individual sessions (limitation)
- ⚠️ Session data persists until expiry (30 days)

**Mitigation**: 
- Session rotation on sensitive operations
- Short session lifetime for sensitive data
- Consider database sessions for admin accounts

---

#### 5. Password Hashing: bcrypt

**Assumption**: All passwords are hashed with bcrypt (10 rounds).

**Implementation**: See `lib/auth/index.ts` line 54:
```typescript
const isValid = await bcrypt.compare(credentials.password, user.password);
```

**Security Parameters**:
- Algorithm: bcrypt
- Rounds: 10 (default for bcryptjs)
- Salt: Automatic (per-password)

**Verification**: All password creation must use bcrypt.hash() with 10+ rounds.

---

#### 6. Admin Access Control

**Assumption**: Superadmin access is controlled by email whitelist in environment variables.

**Implementation**: See `lib/auth/admin.ts`:
```typescript
return config.auth.superadminEmails.includes(userEmail)
```

**Security Implications**:
- ✅ Simple and auditable
- ⚠️ No role-based access control (RBAC)
- ⚠️ Requires environment variable update to add/remove admins

**Limitations**:
- Cannot revoke admin access without redeployment
- No granular permissions
- No audit trail for admin actions

---

## Threat Model

### In-Scope Threats

1. **Account Takeover via OAuth**
   - Mitigation: OAuth email verification + account linking validation
   - Status: ✅ Mitigated

2. **Password Brute Force**
   - Mitigation: bcrypt hashing (slow by design)
   - Status: ⚠️ Partial (no rate limiting)

3. **Session Hijacking**
   - Mitigation: JWT with secret, HTTPS only
   - Status: ✅ Mitigated (assuming HTTPS in production)

4. **Credential Stuffing**
   - Mitigation: bcrypt hashing
   - Status: ⚠️ Partial (no rate limiting, no 2FA)

5. **Admin Privilege Escalation**
   - Mitigation: Email whitelist
   - Status: ✅ Mitigated

### Out-of-Scope Threats

1. **Session Revocation** - Not supported with JWT strategy
2. **2FA/MFA** - Not implemented
3. **Rate Limiting** - Not implemented at auth layer
4. **Email Verification** - Not implemented
5. **Password Reset** - Not implemented

---

## Security Controls

### Implemented Controls

1. **OAuth Email Verification** (Critical)
   - Relies on GitHub/Google email verification
   - Prevents account hijacking via OAuth

2. **Account Linking Validation** (Critical)
   - Only links OAuth accounts (not credentials)
   - Validates email match before linking
   - See: `lib/auth/account-linking.ts`

3. **Password Hashing** (Critical)
   - bcrypt with 10 rounds
   - Automatic salting

4. **Session Security** (Important)
   - JWT strategy
   - 30-day expiry
   - Secret-based signing

5. **Admin Access Control** (Important)
   - Email whitelist
   - Environment variable configuration

### Missing Controls

1. **Rate Limiting** (High Priority)
   - No protection against brute force
   - No protection against credential stuffing
   - **Recommendation**: Implement at API gateway or middleware

2. **Email Verification** (High Priority)
   - Required before adding email/password signup
   - **Recommendation**: Implement before any signup feature

3. **2FA/MFA** (Medium Priority)
   - No second factor authentication
   - **Recommendation**: Consider for admin accounts first

4. **Session Revocation** (Medium Priority)
   - Cannot revoke individual sessions
   - **Recommendation**: Consider database sessions for sensitive accounts

5. **Password Reset** (Medium Priority)
   - No self-service password reset
   - **Recommendation**: Implement with email verification

6. **Audit Logging** (Low Priority)
   - No audit trail for authentication events
   - **Recommendation**: Log all auth events (login, logout, failures)

---

## Known Limitations

### 1. No Session Revocation

**Impact**: Cannot revoke compromised sessions until expiry (30 days)

**Workaround**: 
- Change JWT secret (revokes ALL sessions)
- Delete user from database (prevents new sessions)

**Future Solution**: Implement database sessions or session blacklist

---

### 2. No Rate Limiting

**Impact**: Vulnerable to brute force and credential stuffing attacks

**Mitigation**: 
- bcrypt slows down password checking
- Monitor for suspicious activity

**Future Solution**: Implement rate limiting middleware

---

### 3. No Email Verification

**Impact**: Cannot safely add email/password signup

**Current State**: ✅ SAFE (no signup endpoint)

**Future Solution**: Implement email verification before adding signup

---

### 4. No 2FA/MFA

**Impact**: Single factor authentication only

**Risk Level**: Medium (mitigated by OAuth for most users)

**Future Solution**: Implement TOTP or SMS-based 2FA

---

### 5. No Granular Permissions

**Impact**: Only two roles: user and superadmin

**Limitation**: Cannot implement fine-grained access control

**Future Solution**: Implement RBAC with roles and permissions

---

## Security Checklist

Use this checklist for all authentication-related changes:

### Before Making Changes

- [ ] Review this security documentation
- [ ] Understand current security assumptions
- [ ] Identify which assumptions your change affects

### Code Changes

- [ ] No new `any` types in authentication code
- [ ] All passwords hashed with bcrypt (10+ rounds)
- [ ] All emails normalized (lowercase + trim)
- [ ] OAuth providers verify emails
- [ ] Account linking only for OAuth (not credentials)
- [ ] No unverified email/password signup

### Testing

- [ ] Unit tests for new authentication logic
- [ ] E2E tests for new authentication flows
- [ ] Security test cases (negative testing)
- [ ] Test with invalid/malicious inputs

### Documentation

- [ ] Update this security documentation
- [ ] Document new security assumptions
- [ ] Update threat model if needed
- [ ] Add code comments for security-critical code

### Review

- [ ] Code review by security-aware developer
- [ ] Review against OWASP Top 10
- [ ] Review against this security checklist
- [ ] Update security assumptions if needed

### Deployment

- [ ] Test in staging environment
- [ ] Verify HTTPS is enabled
- [ ] Verify JWT secret is secure
- [ ] Verify environment variables are set correctly

---

## Emergency Procedures

### Compromised JWT Secret

1. Generate new JWT secret
2. Update environment variable
3. Redeploy application
4. **Impact**: All users logged out

### Compromised Admin Account

1. Remove email from `SUPERADMIN_EMAILS` environment variable
2. Redeploy application
3. Review audit logs for unauthorized actions
4. **Impact**: Admin loses access immediately

### Suspected Account Takeover

1. Delete user's accounts from database (prevents OAuth linking)
2. Delete user from database (prevents credentials login)
3. Contact user to verify and recreate account
4. **Impact**: User loses access until recreated

---

## Review Schedule

- **Quarterly**: Review OAuth provider email verification policies
- **Before Major Changes**: Review this entire document
- **After Security Incidents**: Update threat model and controls
- **Annually**: Full security audit of authentication system

---

**Document Owner**: Engineering Team  
**Last Security Audit**: 2025-10-18  
**Next Review Date**: 2026-01-18

