# Backup and rollback procedures

## What exists now

- `scripts/deploy.sh`
  - Installs deps, builds app, and deploys Docker stack (`config/docker-compose.server.yml`)
  - Validates env, uses BuildKit, waits for health
- `scripts/rollback.sh`
  - Restores a previously created backup into the deploy directory
  - Reinstalls deps and rebuilds, restarts Docker stack
- Container startup (`config/docker-entrypoint.sh`)
  - Waits for DB availability and runs `prisma migrate deploy`

## Backups

- Before deployment, `deploy.sh` creates a backup under `${HOME}/production/json-viewer-io-backups/backup-YYYY-MM-DD-HH_MM_SS`
- Contents exclude `.next`, `node_modules`, `.git`
- The current commit hash (if repo exists) is saved as `.commit`

## Recommended operator flow

1. Provision environment variables on the server
2. Run `scripts/deploy.sh`
3. Verify health (deploy script checks `/api/health`)
4. If issues arise, run `scripts/rollback.sh` and select a backup

## Notes

- Database backups/restores are environment-specific and not handled here. For PostgreSQL, take base backups or use managed service snapshots before major schema changes.
- Prisma migrations are applied on container start; rollbacks should assume forward-fix migrations (do not manually edit historical migrations).
