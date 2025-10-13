# Quick Start: Using New Utilities

## 🎯 Overview

Four new utilities have been created to improve code quality:

1. ✅ **Logger** - `lib/logger.ts`
2. ✅ **API Client** - `lib/api/client.ts`
3. ✅ **Error Classes** - `lib/utils/app-errors.ts`
4. ✅ **API Types** - `lib/api/types.ts`

---

## 🚀 5-Minute Setup

### 1. Replace Console Statements

**Find**:
```bash
grep -r "console\." --include="*.ts" --include="*.tsx" components/
```

**Replace**:
```typescript
// Before
console.log('User action', data);
console.error('Failed:', error);

// After
import { logger } from '@/lib/logger';

logger.info('User action', { data });
logger.error('Failed', error, { context });
```

---

### 2. Replace Fetch Calls

**Find**:
```bash
rg "fetch\(" --type ts --type tsx
```

**Replace**:
```typescript
// Before
const response = await fetch('/api/json/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
if (!response.ok) throw new Error('Failed');
const result = await response.json();

// After
import { apiClient } from '@/lib/api/client';

const result = await apiClient.post('/api/json/upload', data);
```

---

### 3. Use Specific Error Classes

**In API Routes**:
```typescript
// Before
if (!document) {
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}

// After
import { NotFoundError } from '@/lib/utils/app-errors';
import { handleApiError } from '@/lib/api/utils';

if (!document) {
  throw new NotFoundError('Document', id);
}

// In route handler
try {
  // ... your logic
} catch (error) {
  return handleApiError(error);
}
```

---

### 4. Add Type Safety

```typescript
// Before
async function getData(id: string) {
  return apiClient.get(`/api/json/${id}`);
}

// After
import type { Document } from '@/lib/api/types';

async function getData(id: string): Promise<Document> {
  return apiClient.get<Document>(`/api/json/${id}`);
}
```

---

## 📋 Priority Migration Order

### Phase 1: API Routes (Day 1)
**Files**: `app/api/**/*.ts`

**Changes**:
- ✅ Import error classes
- ✅ Throw specific errors instead of returning error responses
- ✅ Use `handleApiError` in catch blocks
- ✅ Replace `console.*` with `logger`

**Example**: See `docs/MIGRATION_GUIDE.md` for detailed examples

---

### Phase 2: State Management (Day 2)
**Files**: `lib/store/*.ts`

**Changes**:
- ✅ Replace `fetch()` with `apiClient`
- ✅ Replace `console.*` with `logger`
- ✅ Add type imports from `lib/api/types`

**Priority**: Start with `backend.ts` (most fetch calls)

---

### Phase 3: Components (Week 1)
**Files**: `components/**/*.tsx`

**Changes**:
- ✅ Replace `console.*` with `logger`
- ✅ Handle `ApiError` in try-catch blocks
- ✅ Add type annotations

---

## 🔧 ESLint Integration

ESLint now enforces:
- ✅ No relative imports (use `@/` prefix)
- ⚠️ Console statements warn (migrate to logger)

**Run**:
```bash
npm run lint
```

**Auto-fix**:
```bash
npm run lint -- --fix
```

---

## 📊 Progress Tracking

Track migration progress:

```bash
# Count remaining console statements
rg "console\.(log|error|warn|debug)" --type ts --type tsx | wc -l

# Count remaining fetch calls
rg "fetch\(" --type ts --type tsx | wc -l

# Count files with relative imports
rg "from ['\"]\.\./" --type ts --type tsx | wc -l
```

**Target**:
- ✅ 0 console statements (use logger)
- ✅ 0 direct fetch calls (use apiClient)
- ✅ 0 relative imports (use @/)

---

## 🎯 Success Metrics

### Before Refactoring
- 🔴 Console statements: 591
- 🔴 Direct fetch calls: 19 files
- 🟡 Inconsistent error handling
- 🟡 Mixed import styles

### After Refactoring
- ✅ Structured logging: 100%
- ✅ Centralized API calls: 100%
- ✅ Consistent error responses: 100%
- ✅ Absolute imports: 100%

---

## 💡 Tips

1. **Start Small**: Migrate 1-2 files as proof of concept
2. **Test Each Change**: Run tests after each migration
3. **Use Find & Replace**: VSCode/IDE regex search helps
4. **Commit Often**: Small commits make rollback easier
5. **Run Lint**: Check for issues frequently

---

## 🐛 Common Issues

### Issue: TypeScript errors after import changes
**Solution**: Restart TypeScript server in IDE

### Issue: ESLint complaining about console
**Solution**: Replace with `logger` or add `// eslint-disable-next-line no-console`

### Issue: API client timeout
**Solution**: Increase timeout in options:
```typescript
apiClient.get('/api/slow', { timeout: 60000 })
```

---

## 📚 Full Documentation

- 📖 [Utilities README](./UTILITIES_README.md) - Complete API reference
- 🔄 [Migration Guide](./MIGRATION_GUIDE.md) - Detailed migration examples
- 🎓 [Examples](../lib/api/examples/) - Code examples

---

## ✅ Checklist

Before starting migration:
- [ ] Read this Quick Start
- [ ] Review Migration Guide
- [ ] Check Utilities README for API details
- [ ] Run `npm run lint` to see current issues
- [ ] Create a feature branch for migration

During migration:
- [ ] Migrate 1-2 files as test
- [ ] Run tests to verify
- [ ] Commit changes
- [ ] Continue with remaining files
- [ ] Run full test suite
- [ ] Update documentation if needed

After migration:
- [ ] Run `npm run lint` (should pass)
- [ ] Verify all tests pass
- [ ] Check build succeeds
- [ ] Update team about new utilities
- [ ] Archive old utility functions

---

**Ready to start?** Begin with API routes in `app/api/` - they'll have the biggest impact!
