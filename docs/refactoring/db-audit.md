# Database & Migrations Audit

This document summarizes the current database posture and the improvements applied in this pass.

## Summary of current state

- PostgreSQL with Prisma ORM; extensions enabled: `btree_gin`, `uuid-ossp`
- Models: User, Account, Session, VerificationToken, JsonDocument, JsonChunk, JsonAnalytics, JsonSession, SeoSettings
- Cascade deletes configured for relations (see migration 20251017060610_add_cascade_delete)
- Strong index coverage on JsonDocument, including GIN indexes on `content` and `tags`, and composite indexes for public library queries
- Seed script present and deterministic (prisma/seed.ts)

## Changes applied in this audit

- Added helpful indexes to support common queries and sorts:
  - `JsonDocument`: `@@index([updatedAt])` — supports sort by last update
  - `JsonDocument`: `@@index([userId, createdAt])` — supports user-scoped recent documents
  - `JsonDocument`: `@@index([userId, updatedAt])` — supports user-scoped updated documents

Note: These changes are in `prisma/schema.prisma`. A migration must be generated and applied to take effect (see Next steps).

## Rationale

- App frequently sorts by `updated` and `recent` in document lists (see `lib/db/queries/common.ts`), including user-scoped lists. Dedicated indexes reduce sort cost and improve pagination performance.

## Verified items

- Existing indexes already cover:
  - Public library paths: `@@index([visibility, publishedAt])`, `@@index([visibility, createdAt])`, `@@index([visibility, viewCount])`
  - Content search primitives: `@@index([content], type: Gin)`, `@@index([tags], type: Gin)`
  - Hot select columns: `createdAt`, `viewCount`, `publishedAt`, etc.
- Relations use `onDelete: Cascade` where appropriate (JsonDocument → chunks/analytics)

## Next steps (operational)

- Generate and apply migration:
  - Locally: `npm run db:migrate` (creates a new migration) then `npm run db:reset && npm run db:seed` for a clean dev DB
  - In Docker/server: ensure `npx prisma migrate deploy` runs on deploy (already handled in `config/docker-entrypoint.sh`)
- Consider (optional, future):
  - Remove redundant `@@index([shareId])` since `shareId` is `@unique`
  - BRIN index on `createdAt` for very large tables to optimize range scans
  - Non-unique index on `checksum` if we add de-duplication lookups

## Seed and data hygiene

- Seed creates 3 public examples and 2 private examples; passwords hashed with bcrypt
- No PII or secrets in seed; deterministic values aid tests

## Rollback readiness

- Scripts/rollback.sh and scripts/deploy.sh present; migrations executed during container start via `config/docker-entrypoint.sh`
