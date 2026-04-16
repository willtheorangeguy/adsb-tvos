# tvOS app scaffold

This folder hosts the Apple TV surface. It reuses the shared ADS-B client/state logic from `@adsb/shared`.

## Why this scaffold is Windows-safe

The core tracking engine lives in `packages/shared`, so live map/tracking behavior can be implemented and tested from Windows via `apps/web`.

## macOS release setup

On macOS, initialize this folder as a `react-native-tvos` app and wire in `src/App.tsx` from this scaffold:

1. `npx @react-native-community/cli@latest init AdsbTv --version npm:react-native-tvos@latest --skip-install`
2. Copy `src` from this folder into the generated project.
3. Add workspace aliasing for `@adsb/shared` in Metro config.
4. Build and run on Apple TV simulator/device via Xcode.
