# Prisma migrations hygiene

This repo uses Prisma Migrate with PostgreSQL. Follow these conventions to keep dev/prod stable and reproducible.

## Flows

- Local development
  - Edit `prisma/schema.prisma`
  - Create migration: `npm run db:migrate` (creates a new migration in prisma/migrations and updates the dev DB)
  - Regenerate client if needed: `npx prisma generate`
  - Optional: seed dev DB: `npm run db:seed`
  - Check status: `npm run db:status`
- CI/Build
  - Build does not apply migrations (no DB dependency required)
- Deploy (server/container)
  - The container entrypoint runs `prisma migrate deploy` on startup (see `config/docker-entrypoint.sh`)
  - `scripts/deploy.sh` builds image and starts stack; migrations apply automatically in container

## Conventions

- Never edit past migrations; always add new ones
- Keep SQL idempotent where possible; use Prisma generated migrations
- Prefer `migrate dev` locally and `migrate deploy` in environments
- Avoid `db push` except for bootstrapping ephemeral dev DBs (we keep `init-db.sh` legacy script around, but standard flow is migrate)

## Current pending change

- Added indexes in `schema.prisma` for common queries:
  - `@@index([updatedAt])`
  - `@@index([userId, createdAt])`
  - `@@index([userId, updatedAt])`
- Action required: generate and apply migration
  - Dev: `npm run db:migrate`
  - Server: handled by `prisma migrate deploy` during container startup

## Troubleshooting

- View migration status: `npm run db:status`
- Reset dev DB (destructive): `npm run db:reset` then `npm run db:seed`
- If migrations drift occurs in dev, use reset; in prod, fix forward with a new migration
