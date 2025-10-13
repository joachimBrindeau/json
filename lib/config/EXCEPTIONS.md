# Environment Configuration Exceptions

This document lists legitimate exceptions to the centralized environment configuration pattern where direct `process.env` access is required.

## Build-Time Configuration Files

These files require direct `process.env` access because they execute during the build process, before the runtime configuration module can be loaded:

### 1. `next.config.ts`
**Location**: `/next.config.ts`

**Why it's an exception**:
- Executes during Next.js build time
- Needs to configure the build process itself
- Cannot import runtime modules during build configuration

**Current usage**:
```typescript
// Line 19: NEXT_PUBLIC_BUILD_ID
env: {
  NEXT_PUBLIC_BUILD_ID: process.env.BUILD_ID || Date.now().toString(),
}

// Line 231: NODE_ENV for production optimization
removeConsole: process.env.NODE_ENV === 'production',
```

**Justification**: These are build-time configurations that must be evaluated before the application runtime starts.

## Summary

- **Total exceptions**: 1 file (`next.config.ts`)
- **Total direct process.env usages in exceptions**: 2 instances
- **All other process.env usage**: Migrated to centralized config module

## Validation

To verify all non-exception process.env usage has been migrated:

```bash
# Search for process.env usage (excluding exceptions)
grep -r "process\.env" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude=next.config.ts \
  --exclude="*.md"
```

Expected result: Only occurrences in:
- `lib/config/env.ts` (the centralized config module)
- Documentation files
