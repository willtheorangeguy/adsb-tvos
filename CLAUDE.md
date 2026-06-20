# CLAUDE.md

## Project Overview

ADS-B TV is an Apple TV + Windows ADS-B aircraft viewer for local PiAware feeders. It displays live aircraft positions on a Leaflet map using data from a local PiAware (dump1090) receiver.

## Architecture

npm workspaces monorepo with three apps and one shared package:

- **apps/web** (`@adsb/web`) — React 19 + Vite frontend with Leaflet maps. Main UI.
- **apps/tvos** (`@adsb/tvos`) — tvOS-specific React module with focus navigation for Apple TV remote.
- **apps/proxy** (`@adsb/piaware-proxy`) — Express 5 CORS proxy that sits between the web app and a local PiAware receiver.
- **packages/shared** (`@adsb/shared`) — Shared types, formatters, filters, and PiAware client logic.

## Commands

From the repo root:

```bash
npm install              # Install all workspace dependencies
npm run dev              # Start web dev server (Vite)
npm run dev:proxy        # Start proxy dev server (tsx watch)
npm run build            # Build all workspaces
npm run lint             # Lint all workspaces (ESLint)
npm run test             # Test all workspaces (Vitest)
npm run typecheck        # Typecheck all workspaces (tsc)
```

## Tech Stack

- **Runtime**: Node.js >= 20
- **Language**: TypeScript 6
- **Frontend**: React 19, Vite 8, Leaflet/react-leaflet
- **Backend**: Express 5, cors, dotenv
- **Testing**: Vitest
- **Linting**: ESLint with typescript-eslint, react-hooks, react-refresh plugins
- **CI**: GitHub Actions — lint, test, build on ubuntu; tvOS typecheck+test on macos; Playwright screenshot

## Environment Variables

**apps/web/.env**: `VITE_PIAWARE_MODE`, `VITE_PIAWARE_BASE_URL`, `VITE_POLL_MS`
**apps/proxy/.env**: `PIAWARE_BASE_URL`, `PORT`

## Key Conventions

- ESM throughout (`"type": "module"` in all packages)
- Shared code goes in `packages/shared`, imported as `@adsb/shared`
- Tests live next to source files (e.g., `tracker.test.ts`, `focusNavigation.test.ts`)
- No comments unless explaining non-obvious "why"
- CI must pass lint, test, and build before merge
