# 🔐 API Security Recommendations

**Priority**: CRITICAL  
**Target Completion**: 2 weeks

---

## 🚨 Critical Security Issues

### 1. Distributed Rate Limiting (CRITICAL)

**Current Issue**:
```typescript
// lib/middleware/rate-limit.ts
class SimpleRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  // ❌ In-memory storage - doesn't work across multiple instances
}
```

**Problem**: 
- Rate limits can be bypassed by hitting different server instances
- Memory leaks possible with many unique identifiers
- Lost on server restart

**Solution**:
```typescript
// lib/middleware/redis-rate-limit.ts
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = Redis.fromEnv();

export const createRateLimiter = (config: {
  requests: number;
  window: string;
  prefix?: string;
}) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: config.prefix || 'ratelimit',
    analytics: true,
  });
};

// Usage
export const uploadLimiter = createRateLimiter({
  requests: 5,
  window: '1 m',
  prefix: 'upload',
});

export const publishLimiter = createRateLimiter({
  requests: 10,
  window: '15 m',
  prefix: 'publish',
});

// Middleware
export const withRedisRateLimit = (limiter: Ratelimit) => 
  (handler: ApiRouteHandler) => 
    async (req: NextRequest, context: any) => {
      const identifier = await getIdentifier(req);
      const { success, limit, remaining, reset } = await limiter.limit(identifier);
      
      if (!success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            limit,
            remaining,
            reset: new Date(reset).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }
      
      const response = await handler(req, context);
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', reset.toString());
      
      return response;
    };

async function getIdentifier(req: NextRequest): Promise<string> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return `user:${session.user.id}`;
  }
  
  // Fallback to IP with fingerprinting
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  
  return createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex');
}
```

**Implementation Steps**:
1. Install `@upstash/redis` and `@upstash/ratelimit`
2. Set up Upstash Redis (free tier available)
3. Add environment variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Replace all `SimpleRateLimiter` instances
5. Test with load testing tool

---

### 2. CORS Security (CRITICAL)

**Current Issue**:
```typescript
// Multiple endpoints have this:
headers: {
  'Access-Control-Allow-Origin': '*', // ❌ Allows ANY origin
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

**Affected Endpoints**:
- `/api/json/upload`
- `/api/json/analyze`
- `/api/extension/submit`

**Problem**:
- Any website can make requests to your API
- CSRF attacks possible
- Data can be exfiltrated to malicious sites

**Solution**:
```typescript
// lib/api/cors.ts
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  // Add browser extension origins
  'chrome-extension://YOUR_EXTENSION_ID',
  // Development
  ...(process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:3001'] 
    : []),
].filter(Boolean) as string[];

export function getCorsHeaders(origin: string | null): HeadersInit {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin', // Important for caching
  };
}

export const withCors = (handler: ApiRouteHandler): ApiRouteHandler => 
  async (req, context) => {
    const origin = req.headers.get('origin');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }
    
    const response = await handler(req, context);
    
    // Add CORS headers to response
    const corsHeaders = getCorsHeaders(origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };

// Usage
export const POST = withCors(
  withAuth(async (req, session) => {
    // Your handler
  })
);
```

**Environment Variables**:
```bash
# .env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CHROME_EXTENSION_ID=your-extension-id
```

---

### 3. Request Size Limits (HIGH)

**Current Issue**:
- No body size limits on most endpoints
- Can cause memory exhaustion
- DoS attack vector

**Solution**:
```typescript
// lib/api/middleware/size-limit.ts
export const DEFAULT_SIZE_LIMITS = {
  json: 10 * 1024 * 1024, // 10MB
  upload: 100 * 1024 * 1024, // 100MB
  image: 5 * 1024 * 1024, // 5MB
} as const;

export const withSizeLimit = (maxBytes: number = DEFAULT_SIZE_LIMITS.json) => 
  (handler: ApiRouteHandler): ApiRouteHandler => 
    async (req, context) => {
      const contentLength = req.headers.get('content-length');
      
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (size > maxBytes) {
          return new NextResponse(
            JSON.stringify({
              error: 'Request entity too large',
              maxSize: maxBytes,
              receivedSize: size,
            }),
            {
              status: 413,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
      
      // For streaming requests without content-length
      let bytesRead = 0;
      const originalJson = req.json.bind(req);
      
      req.json = async () => {
        const text = await req.text();
        bytesRead = new Blob([text]).size;
        
        if (bytesRead > maxBytes) {
          throw new Error(`Request too large: ${bytesRead} bytes`);
        }
        
        return JSON.parse(text);
      };
      
      try {
        return await handler(req, context);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Request too large')) {
          return new NextResponse(
            JSON.stringify({ error: error.message }),
            { status: 413 }
          );
        }
        throw error;
      }
    };

// Usage
export const POST = withSizeLimit(DEFAULT_SIZE_LIMITS.upload)(
  withAuth(async (req, session) => {
    // Your handler
  })
);
```

**Next.js Config**:
```typescript
// next.config.ts
export default {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Default for all API routes
    },
  },
  // For specific routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};
```

---

### 4. API Key Authentication (HIGH)

**Current Issue**:
- Only session-based auth
- No way for external services to authenticate
- No programmatic access

**Solution**:
```typescript
// lib/api/middleware/api-key.ts
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string; // Hashed
  scopes: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
}

export const withApiKey = (requiredScopes: string[] = []) => 
  (handler: ApiRouteHandler): ApiRouteHandler => 
    async (req, context) => {
      const apiKey = req.headers.get('x-api-key') || 
                     req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!apiKey) {
        return new NextResponse(
          JSON.stringify({ error: 'API key required' }),
          { status: 401 }
        );
      }
      
      // Hash the provided key
      const hashedKey = createHash('sha256').update(apiKey).digest('hex');
      
      // Look up in database
      const key = await prisma.apiKey.findUnique({
        where: { keyHash: hashedKey },
        include: { user: true },
      });
      
      if (!key) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401 }
        );
      }
      
      // Check expiration
      if (key.expiresAt && key.expiresAt < new Date()) {
        return new NextResponse(
          JSON.stringify({ error: 'API key expired' }),
          { status: 401 }
        );
      }
      
      // Check scopes
      const hasRequiredScopes = requiredScopes.every(scope => 
        key.scopes.includes(scope)
      );
      
      if (!hasRequiredScopes) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Insufficient permissions',
            required: requiredScopes,
            granted: key.scopes,
          }),
          { status: 403 }
        );
      }
      
      // Update last used
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });
      
      // Add to request context
      (req as any).apiKey = key;
      (req as any).user = key.user;
      
      return handler(req, context);
    };

// Usage
export const GET = withApiKey(['read:documents'])(
  async (req) => {
    const user = (req as any).user;
    // Your handler
  }
);
```

**Database Schema**:
```prisma
// prisma/schema.prisma
model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  keyHash     String    @unique
  scopes      String[]
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  
  @@index([userId])
  @@index([keyHash])
}
```

**API Key Generation**:
```typescript
// lib/api/generate-api-key.ts
import { randomBytes } from 'crypto';

export async function generateApiKey(
  userId: string,
  name: string,
  scopes: string[],
  expiresInDays?: number
): Promise<{ key: string; id: string }> {
  // Generate random key
  const key = `sk_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(key).digest('hex');
  
  // Save to database
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      scopes,
      expiresAt: expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });
  
  // Return the plain key (only time it's visible)
  return { key, id: apiKey.id };
}
```

---

### 5. Input Sanitization (MEDIUM)

**Current Issue**:
- Some endpoints don't sanitize user input
- XSS risk in stored content
- SQL injection risk (if using raw queries)

**Solution**:
```typescript
// lib/api/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
import { escape } from 'html-escaper';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title'],
  });
}

export function sanitizeString(input: string): string {
  return escape(input.trim());
}

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const sanitized = { ...obj };
  
  fields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field] as string) as T[typeof field];
    }
  });
  
  return sanitized;
}

// Usage
const data = await request.json();
const sanitized = sanitizeObject(data, ['title', 'description']);
```

---

## 📋 Implementation Checklist

### Week 1
- [ ] Set up Upstash Redis account
- [ ] Implement Redis-based rate limiting
- [ ] Replace all `SimpleRateLimiter` instances
- [ ] Add rate limiting to upload endpoint
- [ ] Fix CORS wildcard origins
- [ ] Add request size limits

### Week 2
- [ ] Implement API key authentication
- [ ] Create API key management UI
- [ ] Add input sanitization middleware
- [ ] Update all endpoints to use new middleware
- [ ] Write security tests
- [ ] Update documentation

---

**Next Steps**: Review and approve this plan, then begin implementation.

