#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -d node_modules ] || [ ! -d apps/tvos/node_modules ]; then
  npm run setup
fi
npm run build --workspace @adsb/shared
if [ ! -d apps/tvos/ios/Pods ]; then
  (cd apps/tvos/ios && RCT_NEW_ARCH_ENABLED=0 pod install)
fi
simulator_id=$(xcrun simctl list devices available -j | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const all=Object.entries(JSON.parse(s).devices).filter(([k])=>k.includes("tvOS")).flatMap(([,v])=>v);const tv=all.find(d=>d.name.includes("1080p"))||all[0];if(!tv){console.error("Install a tvOS simulator runtime in Xcode Settings > Components.");process.exit(1);}console.log(tv.udid);})')
if ! xcrun simctl list devices booted | rg -q "$simulator_id"; then
  xcrun simctl boot "$simulator_id"
fi
open -a Simulator --args -CurrentDeviceUDID "$simulator_id"
metro_pid=''
if ! curl -fsS http://127.0.0.1:8081/status >/dev/null 2>&1; then
  (cd apps/tvos && npm start -- --host 127.0.0.1) > /tmp/adsb-metro.log 2>&1 &
  metro_pid=$!
fi
xcodebuild -workspace apps/tvos/ios/AdsbTvos.xcworkspace -scheme AdsbTvos -configuration Debug -destination "platform=tvOS Simulator,id=$simulator_id" -derivedDataPath /tmp/adsb-tv-build CODE_SIGNING_ALLOWED=NO build > /tmp/adsb-build.log 2>&1 || { tail -60 /tmp/adsb-build.log; exit 1; }
xcrun simctl install "$simulator_id" /tmp/adsb-tv-build/Build/Products/Debug-appletvsimulator/AdsbTvos.app
xcrun simctl launch "$simulator_id" org.reactjs.native.example.AdsbTvos
echo 'ADS-B TV is open in Simulator. Use arrow keys and Return; Escape is the Menu button.'
if [ -n "$metro_pid" ]; then
  echo 'Keep this terminal open for the development server. Logs: /tmp/adsb-metro.log'
  wait "$metro_pid"
fi
