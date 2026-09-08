# Tailvision comparison and local-receiver scope

Reviewed September 7, 2026 against [Tailvision’s product page](https://www.adsbexchange.com/maps/tailvision/) and [official App Store listing](https://apps.apple.com/us/app/tailvision-by-ads-b-exchange/id6781873162), including their radar, details, and sightings screenshots.

ADS-B TV uses the owner’s local PiAware, dump1090, or readsb receiver. It does not require an ADS-B Exchange account or use the global ADS-B Exchange network. Tailvision’s black/navy panels, green actions, amber local aircraft, range rings, nearby list, and flight detail hierarchy inform the design. The interface is built for a TV remote and shares its actual React Native components with the browser preview.

| Tailvision capability | ADS-B TV implementation | Local-feed / TV boundary |
| --- | --- | --- |
| Live radar | Polling, aircraft selection, heading-oriented aircraft, north-up radar, optional map, recent trails, following/recentering, search and category filters | Only aircraft received by the configured local station; stale signals are distinguished |
| Range | 30, 75 and 150 nm choices, receiver-centered range rings | Actual reception depends on the antenna; there is no account-based range restriction |
| Flight details | Callsign, ICAO, registration, type/category, altitude, speed, heading, vertical rate, squawk, position, distance and direction | Fields appear only when supplied; `r` / `t` readsb aliases supported; optional SkyAware local aircraft database fills registration/type when present |
| Route, operator, photos | Render optional receiver-provided `origin`, `destination`, `operator`, `photo_url` and `photo_credit` | Standard PiAware ADS-B data does not broadcast these. Missing routes/operators are labeled; missing photos use a labeled silhouette. Demo routes/operators are synthetic. No external enrichment is requested |
| Track and alert | Persistent watch rules for a registration/ICAO address, type code, or category; adjustable 5/15/30 nm alerts | On-screen entry alerts while the app is open; no background push notifications. Type/category rules require receiver metadata |
| Point and identify | Overhead list within 30 nm, compass bearings, direction and estimated closest approach | Apple TV has no camera, compass or phone AR. This is a TV adaptation, not camera feature parity. Closest approach assumes constant speed/heading |
| Capture sightings | One-action saving of aircraft telemetry, time, location and recent trail | A telemetry snapshot rather than a camera photograph; up to 500 sightings retained on-device |
| Share sightings | Scan a QR containing the sighting text; browser text download and JSON logbook export | No cloud account, upload or automatic posting |
| Personal logbook | Persistent sightings, unique aircraft count, deletion, export | Demo and real sightings are separated; browser and simulator storage are independent |
| Bring your own receiver / coverage | Endpoint discovery, optional receiver location fallback, current coverage plot and signal counts | Current positions/recent session trails, not a historical antenna coverage heatmap or ADS-B Exchange station linking |

## Receiver protocol

Enter the host root, for example `http://192.168.1.50`. Direct mode discovers these data directories in order: `/skyaware/data`, `/data`, `/tar1090/data`, `/dump1090-fa/data`, `/dump1090/data`. It reuses the discovered directory for `aircraft.json` and optional `receiver.json`. Optional static aircraft metadata is read from the sibling `db` directory using cached ICAO-prefix shards, with two background requests at a time. Missing database files do not block live polling. The browser can connect directly when the feeder allows CORS; otherwise the bundled local proxy exposes `/api/aircraft` and `/api/receiver`.

If the receiver omits coordinates, add its latitude and longitude in Settings. The map can center on the aircraft cluster in the meantime, but distance, range filtering, and overhead direction require a receiver location. Request timeouts, serial polling, stale-position marking, and automatic retries handle outages without labeling cached positions as fresh.

External map tiles come from OpenStreetMap only when Map is enabled. Radar mode needs no map service or API key. Photos, if present in an enriched local feed, are loaded from that feed’s HTTPS photo URL.

## Validation

- Shared unit tests: PiAware/readsb discovery, optional metadata, malformed responses, connection failures, tracking, registration/type aliases, proximity, watch matching, stale positions and demo labeling.
- Native tests: focus navigation logic, TypeScript checks, Xcode simulator build, and an XCTest using the actual TV remote to navigate from the aircraft list into Overhead and return with Menu.
- Playwright: shared TV UI, search, aircraft tracking, persisted rules/sightings, QR sharing and download, logbook deletion, overhead/coverage screens, arrow/Enter/Escape navigation, settings validation, live-protocol fixture, reconnect and stale state.
- Manual native simulator checks and a real local PiAware feed connection are recorded in the development handoff.
