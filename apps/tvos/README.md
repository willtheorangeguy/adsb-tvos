# ADS-B TV native app

The native Apple TV interface also powers the browser preview through React Native Web. Features include radar, range/trails/following, overhead bearings, watched aircraft/types/categories, nearby alerts, local sightings with QR sharing, and receiver settings.

From the repository root:

```bash
npm run setup
npm run tv:run
```

Requires Xcode with a tvOS simulator runtime and CocoaPods. The launcher handles pod installation, Metro, simulator boot, build and launch. For Xcode development, open `ios/AdsbTvos.xcworkspace` and start Metro with `npm start` in this directory.

This remains a separate npm project to keep React Native 18 dependencies isolated from the React 19 web workspace. Install pods with `RCT_NEW_ARCH_ENABLED=0 pod install` to use the supported classic architecture.

[Mac preview and native instructions](../../docs/local-preview.md) · [Feature comparison and data boundaries](../../docs/tailvision-parity.md)
