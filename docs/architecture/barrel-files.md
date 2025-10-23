# Barrel Files Strategy

Barrel files (index.ts / index.tsx) make imports concise but can accidentally hide module boundaries and hurt tree-shaking. Use them intentionally:

## When to use barrels

- Within a single domain folder only (e.g., `lib/json/*`, `components/features/*`).
- To improve ergonomics for closely related modules that are commonly imported together.
- To provide a stable public surface for a domain (internal files can change without churn for importers).

## When to avoid barrels

- Do not re-export across layers (e.g., components barrel re-exporting lib). Keep the architecture explicit.
- Avoid giant top-level barrels that gather many unrelated modules (impairs tree-shaking and discoverability).
- Don’t re-export transitive re-exports through multiple barrels; import from the most specific domain.

## Patterns

- Prefer named exports; avoid default exports in barrels to keep refactors safe.
- Keep barrel files small and flat; don’t import and re-export just to rename—export the original names.
- For large domains, create sub-barrels (e.g., `lib/api/index.ts`, `lib/json/index.ts`) rather than one global barrel.

## Examples

Good:

- `lib/json/index.ts` re-exports json utils/diff/processor and is consumed as `import { processJson } from '@/lib/json'`.
- `components/features/index.ts` re-exports feature modules only.

Avoid:

- `components/index.ts` re-exporting `@/lib/**` or vice versa.
- `index.ts` at repo root that re-exports everything.

## Enforcement

- Rely on the module layering guard (lib must not import components/app).
- Prefer explicit imports from specific subdomains to preserve tree-shaking in sensitive bundles.
