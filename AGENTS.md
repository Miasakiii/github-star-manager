# AGENTS.md

Chrome extension (Manifest V3) for managing GitHub starred repositories. React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand + Dexie (IndexedDB).

## Build & Dev

```bash
npm install
npm run build       # Full build: Vite UI + esbuild background worker + copy assets
npm run dev         # Vite dev server with HMR (UI only; background worker not rebuilt)
```

**Build is split into 3 steps** — `npm run build` runs them sequentially:
1. `build:ui` — Vite bundles popup + sidepanel HTML/JS/CSS into `dist/`
2. `build:bg` — esbuild bundles `src/entrypoints/background/worker.ts` → `dist/background/worker.js`
3. `scripts/copy-files.js` — copies `manifest.json`, icons, and fixes HTML asset paths in `dist/`

The background worker is **not** rebuilt by Vite. It uses esbuild directly. If you modify `worker.ts`, you need `npm run build:bg` or the full `npm run build`.

## Project Structure

Three entrypoints, each loaded independently by Chrome:
- `src/entrypoints/popup/` — small popup window (440×600)
- `src/entrypoints/sidepanel/` — wide side panel view
- `src/entrypoints/background/service_worker` — alarm-based sync + notifications

Shared code in `src/lib/`:
- `github.ts` — GitHub REST API client (auth, starred repos, releases, README, translate)
- `db.ts` — Dexie schema (repos, events, syncMeta tables). Schema versioning at v3 (v3 added `category` field).
- `store.ts` — Zustand store (single source of truth for UI state)
- `sync.ts` — full sync logic + release checking
- `auth.ts` — token management
- `classify.ts` — keyword-based repo classification (8 tech domains + "other")

Components in `src/components/` — `Dashboard`, `RepoCard`, `RepoDetail`, `FilterBar`, `StatsBar`, `EventList`, `LoginScreen`.

## Key Conventions

- **Path alias**: `@/` maps to `src/` (configured in tsconfig + vite.config.ts)
- **No tests or lint config** — there is no test runner, ESLint, or Prettier configured
- **No CI** — no `.github/workflows` directory exists
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (not PostCSS)
- **Chrome types**: `@types/chrome` is a devDependency — use `chrome.*` APIs directly
- **Minification disabled** in Vite config (`minify: false`) — easier to debug in extension

## Gotchas

- `manifest.json` is at the repo root, not in `src/`. The build copies it to `dist/`.
- HTML files live deep in `src/entrypoints/*/index.html` but get copied to `dist/popup.html` and `dist/sidepanel.html` with fixed asset paths.
- `scripts/generate-icons.js` uses `sharp` to generate PNG icons from SVG. Run `node scripts/generate-icons.js` if you modify `public/icon.svg`.
- IndexedDB schema has version migrations (`db.ts` lines 59–70). When adding fields, create a new version.
- The background worker uses `chrome.alarms` for periodic sync (30min) and release checks (2hr). These only fire while the extension is installed, not during development with `npm run dev`.
- API rate limiting: the GitHub client throws on 403 with reset time. No retry logic.

## Auto-Classify Feature (2026-07-07)

Added keyword-based repo classification with 8 predefined tech domains. Current state:

**What works:**
- `src/lib/classify.ts` — classification rules module (CATEGORIES, classifyRepo)
- `src/lib/db.ts` — schema v3 with `category` field
- `src/lib/sync.ts` — classifyRepo called during sync + backfill on init
- `src/lib/store.ts` — viewMode/selectedCategory/categoryStats state
- `src/entrypoints/sidepanel/SidePanelApp.tsx` — category view toggle (全部/分类 tabs)
- `src/components/FilterBar.tsx` — category filter dropdown in popup

**Known issues to fix:**
1. **TS errors**: `JSX.Element` namespace errors in `EventList.tsx:7` and `FilterBar.tsx:46` — React 19 JSX type issue, pre-existing
2. **Runtime errors**: Plugin reports errors when loaded in Chrome — needs debugging
3. **Classification accuracy**: substring matching (`includes()`) causes false positives for short keywords like "ai", "ml", "ui"
4. **Backfill performance**: runs on every init, no completion marker — slow for large repos
5. **UI not fully tested**: category view in side panel needs manual Chrome testing

**Commits for this feature:**
```
1471d97 feat: add category filter to popup FilterBar
174a3b6 feat: add category view toggle to side panel
1194ff5 feat: add category view state and filtering to store
afcb2a5 feat: integrate classification into sync flow with backfill
8868cdd feat: add category field to Repo schema (v3)
54f7934 feat: add keyword-based repo classification rules
```

**Plan spec:** `docs/compose/plans/2026-07-08-auto-classify.md`
