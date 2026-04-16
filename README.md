# ADS-B TV Viewer

An Apple TV-focused ADS-B viewer that consumes data from a local FlightAware PiAware feeder, with a Windows-friendly development workflow.

## Workspace layout

- `apps/web`: Windows-first preview app (React + Vite + Leaflet map)
- `apps/proxy`: Optional local proxy for PiAware endpoints (handles CORS/network quirks)
- `apps/tvos`: tvOS app scaffold (`react-native-tvos`) for Apple TV release work
- `packages/shared`: Shared TypeScript domain models and tracking logic used by both app surfaces

## Quick start (Windows)

1. Install dependencies:
   - `npm install`
2. (Optional, recommended for browsers) start proxy:
   - `npm run dev:proxy`
3. Start the web preview:
   - `npm run dev:web`
4. Open the Vite URL in your browser.

## PiAware endpoint configuration

Web app env vars (`apps/web/.env.local`):

- `VITE_PIAWARE_MODE=proxy` or `direct`
- `VITE_PIAWARE_BASE_URL=http://localhost:7070` (proxy mode) or your PiAware URL (direct mode)
- `VITE_POLL_MS=2000`

Proxy env vars (`apps/proxy/.env` or shell):

- `PIAWARE_BASE_URL=http://piaware.local`
- `PORT=7070`

## tvOS development notes

tvOS binaries and simulator runs require macOS + Xcode. This repo keeps shared data/state/UI logic in TypeScript so behavior can be developed and validated from Windows first, then released from a macOS CI/cloud build pipeline.
