# Bundle Size Report (Next.js build)

Date: 2025-10-21

This report captures the largest built artifacts to guide bundle optimization work.

## Static client chunks (.next/static/chunks)

- 2.3 MB .next/static/chunks/common-db4b7428f22ceccc.js
- 1.2 MB .next/static/chunks/vendors-7b219ad86c39563b.js
- 360 KB .next/static/chunks/app
- 112 KB .next/static/chunks/polyfills-42372ed130431b0a.js
- 24 KB .next/static/chunks/1241.c20f23ecbd5eff46.js
- 8 KB .next/static/chunks/pages
- 4 KB .next/static/chunks/webpack-9511eec44add3a3e.js
- 4 KB .next/static/chunks/main-app-9e5e044f77cced98.js
- 4 KB .next/static/chunks/main-13bb71065c9cbddb.js
- 4 KB .next/static/chunks/4854.8935d9cad525fbfe.js

Note: sizes are uncompressed file sizes reported by du.

## Server chunks (.next/server/chunks)

- 1.1 MB .next/server/chunks/3927.js
- 308 KB .next/server/chunks/4356.js
- 292 KB .next/server/chunks/5734.js
- 292 KB .next/server/chunks/1505.js
- 276 KB .next/server/chunks/8433.js
- 136 KB .next/server/chunks/1502.js
- 136 KB .next/server/chunks/1272.js
- 120 KB .next/server/chunks/5541.js
- 116 KB .next/server/chunks/5873.js
- 116 KB .next/server/chunks/2716.js
- 92 KB .next/server/chunks/2497.js
- 68 KB .next/server/chunks/5611.js
- 40 KB .next/server/chunks/7534.js
- 36 KB .next/server/chunks/9324.js
- 32 KB .next/server/chunks/3397.js
- 32 KB .next/server/chunks/1692.js
- 28 KB .next/server/chunks/9517.js
- 28 KB .next/server/chunks/1307.js
- 24 KB .next/server/chunks/3628.js
- 20 KB .next/server/chunks/7028.js
- 20 KB .next/server/chunks/6780.js
- 16 KB .next/server/chunks/7619.js
- 12 KB .next/server/chunks/9948.js
- 12 KB .next/server/chunks/9508.js
- 12 KB .next/server/chunks/4996.js
- 12 KB .next/server/chunks/3826.js
- 8 KB .next/server/chunks/7962.js
- 8 KB .next/server/chunks/6048.js
- 8 KB .next/server/chunks/4899.js
- 8 KB .next/server/chunks/4540.js
- 8 KB .next/server/chunks/3948.js
- 8 KB .next/server/chunks/1428.js
- 8 KB .next/server/chunks/1222.js
- 4 KB .next/server/chunks/437.js

## App server RSC outputs (.next/server/app)

- 48 KB per-route directories (`compare`, `private`, `share`, etc.)
- 36–44 KB HTML outputs for several routes (library, profile, save, etc.)
- 12 KB per-route .rsc files (RSC payload)

## Overall .next directory sizes

- 1.1G .next (total)
- (subdirs) `.next/static`, `.next/server`, `.next/standalone` present

## Initial Observations

- Client static bundles have two heavy chunks: `common-*.js` (~2.3 MB) and `vendors-*.js` (~1.2 MB).
- Server has one ~1.1 MB chunk; likely aggregation of utilities or Prisma logic.
- Action items will focus on:
  - Ensuring heavy libraries (Monaco, Leaflet, Tiptap, XYFlow, Syntax Highlighter) are dynamically imported, client-only, and code-split.
  - Verifying tree-shaking for icon libraries (lucide-react) and UI barrels.
  - Splitting shared pages/components when appropriate to avoid inflating the common client chunk.

## Next Steps

- Verify isolation and dynamic import patterns for Monaco/Leaflet/Tiptap/XYFlow/Syntax Highlighter.
- Identify which app routes cause inclusion in `common-*.js` and move optional features behind dynamic imports.
- Confirm optimizePackageImports usage and spot any anti-patterns that defeat tree-shaking.

## Changes applied (Monaco/Leaflet/Tiptap/XYFlow isolation)

- Monaco: already dynamic via next/dynamic with ssr: false (components/features/editor/MonacoEditorWithLoading.tsx).
- XYFlow: Viewer now code-splits Flow mode; ViewerFlow is dynamically imported only when Flow is selected (components/features/viewer/Viewer.tsx).
- Leaflet: map components dynamically imported with ssr: false in GeoRenderer (components/features/viewer/node-details/renderers/GeoRenderer.tsx). Global CSS remains imported in app/layout.tsx.
- Tiptap: RichTextEditor is now dynamically imported at usage sites (json metadata form and publish modal), avoiding baseline inclusion.

Quick delta after rebuild (indicative only):

- common chunk: ~2.0 MB (was ~2.3 MB)
- vendors chunk: ~1.5 MB (was ~1.2 MB)
  Interpretation: heavy libs shifted from common to route-split/vendor chunks, reducing always-loaded common; further wins will come from lazy-loading additional feature areas and tightening tree-shaking.

## Virtualization & memoization changes

- ViewerTree: added react-window itemKey to stabilize row identity and reduce unnecessary re-renders.
- JsonViewerBase (legacy/shared): added react-window itemKey in virtualized tree path.
- ViewerList: implemented virtualization via FixedSizeList when filteredItems exceeds virtualizeThreshold; kept animated list for small sets.

Post-change build snapshot (Next.js output):

- First Load JS shared by all: 1.15 MB
  - common-\*.js: 653 kB
  - vendors-\*.js: 489 kB

Notes:

- Flow view and rich text editor are now fully code-split; large libs stay out of common.
- Virtualized list/tree use stable keys and fixed row heights for smoother scrolling.

## Data caching & revalidation

- SEO: Added revalidateTag('seo-settings') after admin updates so layout metadata cached via unstable_cache revalidates immediately.
- Dynamic pages confirmed: library, private, superadmin use dynamic = 'force-dynamic'.
- API: user stats returns private, max-age=30 with in-memory 30s cache to reduce DB load.

- API: Added rate limits
  - /api/json/upload and /api/json (create): publishLimiter (10 per 15m) keyed by user or IP
  - /api/json/find-by-content: tagSuggestLimiter (60 per min) keyed by user or IP
- Query optimization
  - find-by-content now checks checksum first, then JSON structural equality using Prisma findFirst (uses existing checksum + JSON indexes)

- Tags endpoint optimization
  - DB-side aggregation with UNNEST + GROUP BY for popular tags (limited baseline)
  - Small in-memory 60s cache per category; query suggestions filter cached baseline

- Web Vitals profiling
  - Client: WebVitals now POSTs CLS/LCP/TTFB to /api/analytics/web-vitals (sendBeacon/fetch keepalive)
  - Server: /api/analytics/web-vitals validates payloads, rate-limits by IP (60/min), logs structured metrics, and stores a short in-memory buffer
