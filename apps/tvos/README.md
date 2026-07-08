# ADS-B TV (Apple TV app)

A native tvOS app (React Native, via [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos))
that shows live ADS-B aircraft from a local PiAware feeder on an Apple TV. It
reuses the tracking, filtering, and formatting logic from
[`@adsb/shared`](../../packages/shared) — the same code the web app uses — and
adds a TV-native UI driven by the Apple TV remote's focus engine:

- **Status header** — visible/total aircraft, last update, poll interval.
- **Radar** — a polar plot of aircraft relative to the receiver, with range rings.
- **Aircraft list** — focus-navigable with the remote; moving focus selects an aircraft.
- **Details** — full readout for the selected aircraft.
- **Controls** — focusable buttons to cycle the sort field and toggle "position only".

## This is a self-contained project

Unlike the other packages, `apps/tvos` is **not** a root npm workspace. React
Native's native build and Metro do not play well with npm's dependency hoisting,
so this project keeps its own `node_modules` and its own `package-lock.json`. It
depends on `@adsb/shared` via a `file:` dependency and consumes its built output,
so build the shared package first.

## Prerequisites (macOS only)

- Xcode with the **tvOS platform + simulator runtime** installed.
- CocoaPods, Watchman (`brew install cocoapods watchman`).
- Node >= 18.

## Setup

```bash
# 1. Build the shared package (from the repo root)
npm run build --workspace @adsb/shared

# 2. Install this app's dependencies
cd apps/tvos
npm install

# 3. Install CocoaPods (classic architecture — see note below)
cd ios
RCT_NEW_ARCH_ENABLED=0 pod install
cd ..
```

> **Why `RCT_NEW_ARCH_ENABLED=0`?** react-native-tvos 0.76's new-architecture
> codegen currently fails on tvOS, so this app builds against the classic
> architecture. The Podfile also pins `react-native-tvos` (see `overrides` in
> `package.json`) to stop npm from pulling a second, newer core copy that breaks
> codegen.

## Run

```bash
# Start Metro
npm start

# In another terminal, build & launch on the Apple TV simulator
npx react-native run-ios --scheme AdsbTvos --simulator "Apple TV"
```

Or open `ios/AdsbTvos.xcworkspace` in Xcode, pick an **Apple TV** simulator, and
press Run.

## Live vs. demo data

`src/config.ts` controls the feed. By default `demo: true` synthesizes moving
aircraft so the app is populated in the simulator (which can't reach a local
feeder). To use a real feeder, set `demo: false` and point `baseUrl`/`mode` at
your PiAware proxy or receiver (see [`apps/proxy/README.md`](../proxy/README.md)).

## Tests / typecheck

```bash
npm run typecheck   # tsc
npm test            # vitest — covers focus-navigation logic (src/focusNavigation.ts)
```
