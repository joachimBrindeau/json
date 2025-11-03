# ADR-0001: Module Layering and Barrel Files

Date: 2025-10-21
Status: Accepted

## Context

The codebase uses Next.js App Router with the following major layers: app (routing/UI), components (UI modules), hooks (shared client logic), lib (server-side logic, utilities), and types. We want clear, enforceable boundaries to avoid cycles and accidental UI dependencies inside core logic. We also use barrel files (index.ts/x) for ergonomics, which can blur boundaries if misused.

## Decision

1. Layering Rules (Allowed Imports)

- app → components, hooks, lib, types
- components → hooks, lib, types
- hooks → lib, types
- lib → types only
- types → (no imports from other layers)

Hard rule: lib must never import from components or app.

2. Barrel Files Strategy

- Barrels are allowed only within a single domain (e.g., lib/json, components/features).
- Avoid cross-layer re-exports; do not export lib modules from a components barrel (or vice versa).
- Prefer named exports; avoid giant top-level barrels.

3. Guardrails

- Added scripts/check-boundaries.sh and package.json script `check:boundaries`.
- This script fails the build if any lib/\*\* file imports from @/components.

## Consequences

- Clear direction for new modules and refactors; fewer accidental cycles.
- Slightly more explicit imports in some places (good for tree-shaking and clarity).
- We can optionally wire the script into CI to block violations in PRs.

## References

- docs/architecture/naming-co-location.md
- docs/architecture/barrel-files.md
