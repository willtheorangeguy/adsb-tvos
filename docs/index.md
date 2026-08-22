# ADS-B TV Viewer — Documentation

An ADS-B aircraft viewer for a local PiAware feeder, built as a monorepo so the tracking logic
can be developed on Windows and shipped to Apple TV.

```text
adsb-tvos/
├── docs/
│   ├── index.md           this page
│   ├── quickstart.md      three commands to a map
│   ├── installation.md    prerequisites and setup
│   ├── configuration.md   every environment variable
│   ├── architecture.md    why there are three apps and a shared package
│   ├── api.md             the proxy's endpoints
│   ├── development.md     workspace scripts, tests, the tvOS path
│   ├── faq.md             do I need the proxy, do I need a Mac
│   ├── troubleshooting.md CORS, wrong base URL, empty maps
│   └── roadmap.md         known gaps and non-goals
├── apps/web               React + Vite + Leaflet preview
├── apps/proxy             local PiAware proxy (Express, TypeScript)
├── apps/tvos              react-native-tvos scaffold
└── packages/shared        domain models and tracking logic
```

## Pages

- [Quickstart](./quickstart.md) — install, start the proxy, open the map
- [Installation](./installation.md) — Node, and what each surface needs
- [Configuration](./configuration.md) — the environment variables, and which file they go in
- [Architecture](./architecture.md) — the shared package, and why it exists
- [API](./api.md) — what the proxy exposes and why
- [Development](./development.md) — workspace scripts, tests, the macOS boundary
- [FAQ](./faq.md) — the proxy, the Mac requirement, account-free operation
- [Troubleshooting](./troubleshooting.md) — the base-URL mistake, CORS, no aircraft
- [Roadmap](./roadmap.md) — known gaps and non-goals

## The shape worth understanding

Three surfaces, one brain:

```text
  apps/web    (Windows-first preview)  ─┐
                                        ├─► packages/shared  ─► PiAware feeder
  apps/tvos   (Apple TV)               ─┘        via apps/proxy
```

`packages/shared` holds the domain models, filtering, formatting, and tracking. Both app
surfaces consume it, which is what lets behaviour be built and tested from Windows and
released from macOS — see [Architecture](./architecture.md).

## Before you start

The single most common setup mistake is the proxy's `PIAWARE_BASE_URL`. It wants the **host
root** of your feeder — not the `/skyaware/` path you see in your browser, and not the Beast
port `30005`. See [Configuration](./configuration.md).
