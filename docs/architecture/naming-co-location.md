# Naming & Co-location Conventions

These conventions aim to keep the codebase predictable, discoverable, and resilient against architectural drift.

## Module layering (allowed imports)

- app → components, hooks, lib, types
- components → hooks, lib, types (UI layer can depend on hooks and utilities)
- hooks → lib, types
- lib → types only
- types → (no imports from app/components/hooks/lib)

Hard rule: lib must never import from components or app.

## Barrels (index.ts[x])

- Prefer barrels to re-export within a single domain only (e.g., `lib/json/*`, `components/features/*`).
- Do not create cross-layer barrels (e.g., components/index.ts re-exporting lib). Keep layers explicit.
- Avoid star-re-exporting transitive dependencies across layers.

## File naming

- Components: PascalCase (`JsonEditor.tsx`, `HeaderNav.tsx`)
- Hooks: camelCase, prefixed with `use-` (`use-login-modal.ts`, `useLibraryStats.ts`)
- Utilities: kebab-case or camelCase (`toast-helpers.ts`, `json-utils.ts`)
- Route handlers: `route.ts` under `app/api/**`
- Layout shells: `layout.tsx`, route pages: `page.tsx`, boundaries: `loading.tsx`, `error.tsx`, `not-found.tsx`

## Co-location

- Co-locate small domain-specific helpers next to their component/page when they are not reused elsewhere.
- Promote to `lib/**` when used across multiple features, or has no UI coupling.
- Keep test files next to code where practical (unit), and in `tests/**` for E2E.

## Types and schemas

- Shared types live under `types/**`.
- Zod schemas that are shared between API and UI live in `lib/api/validators` (re-exported from `lib/api`).

## Client/server boundaries

- Client components must be marked with `'use client'` and must not import server-only modules (next/headers, prisma, fs, etc.).
- Server utilities and database code live in `lib/**` and are imported by server components or API routes only.

## Import hygiene

- Prefer absolute aliases (`@/components`, `@/lib`) over deep relative paths.
- Avoid `../../..` chains; if you need them, consider moving code or adding an internal barrel within the same domain.
- Keep component imports focused: import from specific subdomains (e.g., `@/components/features/viewer`) rather than from a giant global barrel, to preserve tree-shaking.

## Enforcing boundaries (lightweight guardrail)

- CI/Git hook can grep to forbid `from '@/components'` inside `lib/**`.
- ESLint rule (optional if plugin present): `import/no-restricted-paths` to disallow `lib -> components`.
