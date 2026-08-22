# ADS-B TV Viewer — Quickstart

You need a PiAware feeder on your network and Node installed.

## 1. Install

```bash
npm install
```

One install at the root — this is an npm workspace covering `apps/web`, `apps/proxy`, and
`packages/*`.

## 2. Point the proxy at your feeder

Set `PIAWARE_BASE_URL` for the proxy — the **host root**, nothing more:

```ini
PIAWARE_BASE_URL=http://piaware.local
PORT=7070
```

**Get this right first.** Take the SkyAware URL you use in a browser and drop the trailing
`/skyaware/`. Do not use the Beast port `30005`. The proxy appends the data paths itself.

More detail, including where to put this, in [Configuration](./configuration.md).

## 3. Start the proxy

```bash
npm run dev:proxy
```

Optional in principle, recommended in practice — browsers block the direct request in most
setups. See [FAQ](./faq.md).

## 4. Start the web preview

```bash
npm run dev:web
```

Open the URL Vite prints. Aircraft your receiver can hear appear on the map, refreshing every
`VITE_POLL_MS` milliseconds.

## If the map is empty

In order:

1. **Check the base URL** — the mistake above accounts for most cases.
2. **Confirm the feeder responds** by opening its SkyAware page in a browser.
3. **Confirm the proxy is running** and the web app is in `proxy` mode.
4. **Remember an empty sky is possible** — a receiver with poor placement genuinely hears
   nothing sometimes.

See [Troubleshooting](./troubleshooting.md).

## Then what

- [Architecture](./architecture.md) — how the shared package works
- [Development](./development.md) — tests, and what needs a Mac
