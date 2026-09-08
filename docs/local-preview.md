# Run and interact on a Mac

## Browser preview

Double-click **Open ADS-B TV.command** in the repository, or run:

```bash
npm run setup       # first checkout only: root + native JavaScript dependencies
npm run preview:tv
```

The app opens at **http://127.0.0.1:5173/**. The launcher also starts the local proxy when `apps/proxy/.env` is present. Existing `VITE_PIAWARE_*` environment settings are used on first launch, before in-app settings are saved. This is the actual TV interface rendered with React Native Web, fitted to the browser as a 1920 × 1080 stage. Use a mouse, Tab, or arrow keys; Enter selects and Escape returns. Text fields keep their normal editing keys.

Go to **Settings → Local receiver → Direct**, enter your receiver’s host root, and save. Demo traffic is available without a receiver. Settings, watch rules, and sightings persist in that browser profile. Browser and tvOS storage are independent.

## Native Apple TV simulator

Install Xcode with a tvOS runtime, and CocoaPods (`brew install cocoapods`) if needed, then:

```bash
npm run setup
npm run tv:run
```

The launcher installs pods if absent, boots an Apple TV simulator, starts Metro, builds and installs the app, and opens Simulator. Keep its terminal open if it started Metro. Arrow keys navigate the native focus engine; Return selects. Use Simulator’s remote controls / Menu to go back. If keys do not reach the TV, use **I/O → Input → Send Keyboard Input to Device** and **I/O → Keyboard → Connect Hardware Keyboard**, or open the Apple TV Remote from Simulator’s Window menu.

Alternatively open `apps/tvos/ios/AdsbTvos.xcworkspace` in Xcode, choose an Apple TV simulator, start Metro with `npm start --prefix apps/tvos`, and Run. This project uses the classic React Native architecture; pod installation is `RCT_NEW_ARCH_ENABLED=0 pod install`.

## Feeder without browser CORS

```bash
PIAWARE_BASE_URL=http://your-receiver npm run dev:proxy
```

Choose **Local proxy** and `http://127.0.0.1:7070` in the browser’s Settings. The proxy binds to the Mac’s loopback interface and only reads the configured receiver. Apple TV can normally connect directly to the receiver.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run typecheck --prefix apps/tvos
npm test --prefix apps/tvos
npx playwright install chromium
npm run test:e2e
```

Root builds typecheck the reused TV components, so the separate `apps/tvos` JavaScript dependencies must be installed even for a browser build. `npm run setup` handles that. Native simulator builds require macOS; the browser preview and tests can run on other operating systems.

See [the Tailvision comparison](tailvision-parity.md) for implemented features and hardware/data boundaries.

## Native remote interaction test

With Metro running and the simulator booted:

```bash
xcodebuild test -workspace apps/tvos/ios/AdsbTvos.xcworkspace \
  -scheme AdsbTvos -destination 'platform=tvOS Simulator,name=Apple TV 4K (3rd generation) (at 1080p)' \
  -only-testing:AdsbTvosUITests -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO
```

The test drives `XCUIRemote`, verifies focus can leave the aircraft list, opens Overhead, and checks Menu returns to Radar.
