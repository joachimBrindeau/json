# Environment Configuration - Quick Start Guide

Get started with the centralized environment configuration in 5 minutes.

## 1. Understanding the System

All environment variables are now managed through a single, type-safe configuration module:

```typescript
import { config } from '@/lib/config';

// Type-safe access to all environment variables
const dbUrl = config.database.url;           // string
const isDev = config.isDevelopment;          // boolean
const maxSize = config.performance.maxJsonSizeBytes; // number
```

## 2. Setup (First Time Only)

### Check Your .env File

Compare your `.env` with the new `.env.example`:

```bash
# View the template
cat .env.example

# Compare with your current .env
diff .env .env.example
```

### Ensure Required Variables

These must be in your `.env`:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3456"
NEXTAUTH_SECRET="your-32-character-secret"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Test the Configuration

```bash
# Start the development server
npm run dev

# If it starts successfully, the config is working!
```

## 3. Using in Your Code

### Import the Config

```typescript
import { config } from '@/lib/config';
```

### Common Use Cases

#### Environment Detection
```typescript
// Before
if (process.env.NODE_ENV === 'development') {
  console.log('Debug mode');
}

// After
if (config.isDevelopment) {
  console.log('Debug mode');
}
```

#### Database Access
```typescript
// Before
const dbUrl = process.env.DATABASE_URL;

// After
const dbUrl = config.database.url;
```

#### Performance Settings
```typescript
// Before
const maxSize = parseInt(process.env.MAX_JSON_SIZE_MB || '2048') * 1024 * 1024;

// After
const maxSize = config.performance.maxJsonSizeBytes; // Already calculated
```

#### Authentication
```typescript
// Before
const githubId = process.env.GITHUB_CLIENT_ID!;

// After
const githubId = config.auth.providers.github.clientId; // Already validated
```

#### Analytics Check
```typescript
// Before
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
if (gaId) {
  // Initialize analytics
}

// After
if (config.analytics.ga.enabled) {
  const gaId = config.analytics.ga.measurementId;
  // Initialize analytics
}
```

## 4. Configuration Structure

Quick reference to the config object:

```typescript
config.
  ├─ isDevelopment      // boolean
  ├─ isProduction       // boolean
  ├─ isTest            // boolean
  ├─ nodeEnv           // 'development' | 'production' | 'test'
  │
  ├─ database.
  │   └─ url           // PostgreSQL connection string
  │
  ├─ redis.
  │   └─ url           // Redis connection string
  │
  ├─ auth.
  │   ├─ url           // NextAuth URL
  │   ├─ secret        // NextAuth secret
  │   └─ providers.
  │       ├─ github.   // GitHub OAuth
  │       │   ├─ clientId
  │       │   └─ clientSecret
  │       └─ google.   // Google OAuth
  │           ├─ clientId
  │           └─ clientSecret
  │
  ├─ app.
  │   ├─ url           // Public app URL
  │   ├─ websocketUrl  // WebSocket URL
  │   └─ buildId       // Build identifier
  │
  ├─ performance.
  │   ├─ maxJsonSizeMB      // Max size in MB
  │   ├─ maxJsonSizeBytes   // Max size in bytes
  │   └─ jsonStreamingChunkSize
  │
  ├─ analytics.
  │   ├─ ga.
  │   │   ├─ measurementId
  │   │   └─ enabled   // boolean
  │   ├─ facebook.
  │   │   ├─ pixelId
  │   │   └─ enabled
  │   └─ hotjar.
  │       ├─ id
  │       └─ enabled
  │
  ├─ seo.
  │   ├─ verification.
  │   │   ├─ google
  │   │   ├─ yandex
  │   │   └─ bing
  │   └─ facebook.
  │       └─ appId
  │
  ├─ build.
  │   ├─ id
  │   └─ isCI          // boolean
  │
  └─ testing.
      └─ baseUrl
```

## 5. Migration Cheat Sheet

| Old Pattern | New Pattern |
|-------------|-------------|
| `process.env.NODE_ENV === 'development'` | `config.isDevelopment` |
| `process.env.NODE_ENV === 'production'` | `config.isProduction` |
| `process.env.DATABASE_URL` | `config.database.url` |
| `process.env.REDIS_URL \|\| 'redis://localhost:6379'` | `config.redis.url` |
| `process.env.GITHUB_CLIENT_ID!` | `config.auth.providers.github.clientId` |
| `parseInt(process.env.MAX_JSON_SIZE_MB \|\| '2048')` | `config.performance.maxJsonSizeMB` |
| `!!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` | `config.analytics.ga.enabled` |

## 6. Common Patterns

### Pattern 1: Development-Only Code
```typescript
import { config } from '@/lib/config';

if (config.isDevelopment) {
  // Development-only logging, debugging, etc.
}
```

### Pattern 2: Conditional Features
```typescript
import { config } from '@/lib/config';

export function Analytics() {
  // Check if analytics is configured
  if (!config.analytics.ga.enabled) {
    return null;
  }

  return (
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${config.analytics.ga.measurementId}`} />
  );
}
```

### Pattern 3: API Configuration
```typescript
import { config } from '@/lib/config';

export async function POST(request: Request) {
  const maxSize = config.performance.maxJsonSizeBytes;

  // Validate file size
  if (request.headers.get('content-length') > maxSize) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }
}
```

### Pattern 4: Database Connection
```typescript
import { config } from '@/lib/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: config.database.url,
});
```

## 7. Error Handling

### Missing Required Variables

If a required variable is missing, the app will fail to start with a clear error:

```
❌ Environment validation failed:
  • DATABASE_URL: Required
  • NEXTAUTH_SECRET: NEXTAUTH_SECRET must be at least 32 characters
```

**Solution**: Add the missing variables to your `.env` file.

### Invalid Variable Format

If a variable has an invalid format:

```
❌ Environment validation failed:
  • DATABASE_URL: DATABASE_URL must be a valid PostgreSQL URL
```

**Solution**: Check the format in `.env.example` and fix your `.env` file.

## 8. TypeScript Benefits

### Autocomplete

Type in `config.` and your IDE will show all available options:

![Autocomplete Example](https://via.placeholder.com/600x200?text=IDE+Autocomplete)

### Type Safety

```typescript
// ✅ Works - type-safe
const url: string = config.database.url;

// ❌ Error - type mismatch
const url: number = config.database.url; // Type error!

// ✅ Works - boolean checks
if (config.isDevelopment) { } // boolean

// ❌ Error - no typos allowed
if (config.isDeveloment) { } // Property doesn't exist!
```

## 9. Testing

### Unit Tests

```typescript
import { config } from '@/lib/config';

describe('Feature', () => {
  it('should work in development', () => {
    // Access config in tests
    expect(config.isDevelopment).toBe(true);
  });
});
```

### Mocking Config (if needed)

```typescript
jest.mock('@/lib/config', () => ({
  config: {
    isDevelopment: false,
    isProduction: true,
    database: { url: 'mock-url' },
    // ... other mocked values
  },
}));
```

## 10. Troubleshooting

### Problem: "Cannot find module '@/lib/config'"

**Solution**: Check your TypeScript paths in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./"]
    }
  }
}
```

### Problem: Config validation fails on startup

**Solution**:
1. Check `.env` file exists
2. Compare with `.env.example`
3. Ensure all required variables are set
4. Check variable formats (URLs, lengths, etc.)

### Problem: "Property doesn't exist on config"

**Solution**: The variable might not be in the schema yet. Check `lib/config/env.ts` and add it if needed.

## 11. Next Steps

1. **Read the Docs**: Check `/lib/config/README.md` for complete documentation
2. **See Examples**: Review `/lib/config/MIGRATION_EXAMPLES.md` for real-world examples
3. **Start Migrating**: Update your files one by one
4. **Ask Questions**: Check the docs or ask the team

## 12. Resources

- 📚 **Complete Guide**: `/lib/config/README.md`
- 📝 **Migration Examples**: `/lib/config/MIGRATION_EXAMPLES.md`
- 📊 **Analysis**: `/lib/config/ENVIRONMENT_ANALYSIS.md`
- 📋 **Summary**: `/lib/config/SUMMARY.md`
- 🔧 **Template**: `/.env.example`

## Quick Commands

```bash
# View environment template
cat .env.example

# Check your environment
cat .env

# Start development (validates config)
npm run dev

# Run tests
npm test

# Build for production (validates config)
npm run build
```

## That's It!

You're ready to use the centralized environment configuration. Start by importing `config` in your files and enjoy type-safe, validated environment access.

```typescript
import { config } from '@/lib/config';

// Happy coding! 🚀
```
