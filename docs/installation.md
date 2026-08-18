# ADS-B TV Viewer — Installation

## Requirements

| For | You need |
|---|---|
| The web preview and proxy | Node, and a PiAware feeder on your network |
| The tvOS app | macOS with Xcode |

The split is deliberate — everything except the final tvOS build works on Windows.

## Install

```bash
git clone https://github.com/willtheorangeguy/adsb-tvos.git
cd adsb-tvos
npm install
```

One install at the root. This is an npm workspace covering `apps/web`, `apps/proxy`, and
`packages/*`.

**`apps/tvos` is not in the workspace.** It is a separate `react-native-tvos` scaffold with its
own dependency tree, which is why the root scripts do not touch it.

## Configure

The proxy needs to know where your feeder is. See [Configuration](./configuration.md) — and
read the `PIAWARE_BASE_URL` note before setting it, because it is the usual first mistake.

## Verify

```bash
npm run dev:proxy
```

In another terminal:

```bash
npm run dev:web
```

Open the Vite URL. A map with aircraft means everything is connected.

## tvOS

Requires macOS and Xcode. The scaffold is here so the shared logic can be developed and tested
from any OS; building and running on an Apple TV is a macOS job.

See [Development](./development.md).

## Next

[Quickstart](./quickstart.md), or [Configuration](./configuration.md).
