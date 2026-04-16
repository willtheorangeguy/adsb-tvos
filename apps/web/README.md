# Web preview app

Windows-first preview for ADS-B map + tracking features.

## Run

1. Copy `.env.example` to `.env.local` and update values if needed.
2. Start proxy (optional but recommended):
   - `npm run dev:proxy`
3. Start web app:
   - `npm run dev:web`

## Implemented features

- Live PiAware polling
- Aircraft marker map with heading vectors and motion trails
- Receiver marker
- Search + sort + position filter
- Aircraft list and detail panel
- Keyboard directional navigation (remote-like behavior)
