# ADS-B TV Viewer — Architecture

## Three surfaces, one shared brain

```text
  apps/web    React + Vite + Leaflet   ─┐
                                        ├─► packages/shared ─► apps/proxy ─► PiAware feeder
  apps/tvos   react-native-tvos        ─┘
```

`packages/shared` holds the TypeScript domain models, the tracking logic, filtering, and
formatting. Both app surfaces import it.

That is the load-bearing decision in this repository. tvOS binaries need macOS and Xcode, so a
Windows machine cannot build or run the Apple TV app at all — but it can run every piece of
logic that app depends on. Keeping behaviour in `packages/shared` means development and
testing happen anywhere, and macOS is needed only for the final build.

Anything that reasonably belongs in the shared package should go there rather than into a
surface, or that property erodes.

## The shared package

```text
packages/shared/src/
├── types.ts           domain models
├── tracker.ts         tracking logic
├── tracker.test.ts    its tests
├── filters.ts
├── formatters.ts
├── piawareClient.ts   fetching from the feeder
└── index.ts
```

`tracker.test.ts` sitting beside `tracker.ts` is the point — the interesting logic is tested
without a browser, a simulator, or a feeder.

## Why the proxy exists

`apps/proxy` is a small Express service that forwards requests to your PiAware feeder.

It is not there to add features. It exists because browsers make direct access awkward:
cross-origin requests to the feeder are blocked, and a page served over HTTPS cannot fetch
from a plain-HTTP device on the LAN. The proxy sits on the same origin as the dev server and
sidesteps both.

The tvOS app has no such constraint, which is why the proxy is described as optional — it is
a browser workaround, not part of the data path in principle.

## Workspace boundaries

The npm workspace covers `apps/web`, `apps/proxy`, and `packages/*`. **`apps/tvos` is
deliberately outside it**, with its own dependency tree — React Native's toolchain does not
share comfortably with a Vite app.

That is why `npm run build` and friends use `--workspaces --if-present` and do not touch
tvOS.

## Data flow

1. `piawareClient.ts` requests aircraft data through the proxy, or directly.
2. `tracker.ts` turns successive snapshots into tracked aircraft with state over time.
3. `filters.ts` and `formatters.ts` prepare it for display.
4. The surface renders — Leaflet on the web, native components on tvOS.

Only step 4 differs between the two apps.

## No account, no third party

Data comes from a receiver you own, on your network. There is no FlightAware API key, no
subscription, and nothing leaves the LAN — unlike `flightaware-cli` in this org, which uses
the paid AeroAPI.
