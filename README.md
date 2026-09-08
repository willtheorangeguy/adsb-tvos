<!-- Logo -->
<h1 align="center">ADS-B TV Viewer</h1>

<!-- Copy -->
<h4 align="center">A Tailvision-inspired Apple TV radar for your own PiAware, dump1090 or readsb receiver — with an interactive Mac/browser preview.</h4>

<!-- Badges -->
<div align="center">
  <img alt="GitHub Issues" src="https://img.shields.io/github/issues/willtheorangeguy/adsb-tvos">
  <img alt="GitHub Pull Requests" src="https://img.shields.io/github/issues-pr/willtheorangeguy/adsb-tvos">
  <img alt="License" src="https://img.shields.io/github/license/willtheorangeguy/adsb-tvos">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
</div>

<!-- Navigation -->
<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#support">Support</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

## Key Features

- Dark, remote-friendly radar with range rings, aircraft selection, trails, optional maps and following.
- Live aircraft from your own PiAware, dump1090 or readsb receiver; no account or global position feed.
- Overhead bearings, aircraft/type/category watchlists and on-screen nearby alerts.
- Persistent sightings with QR sharing and browser logbook export.
- One TV interface shared by the native Apple TV app and the interactive browser preview.
- Free optional aircraft registry details and credited photos from adsbdb and Planespotters.net.
- Clearly labeled demo traffic for exploring without a receiver.

## Installation

```bash
npm run setup
npm run preview:tv
```

Or double-click **Open ADS-B TV.command**. The preview opens at **http://127.0.0.1:5173/**.

For the native Apple TV simulator on macOS with Xcode’s tvOS runtime:

```bash
npm run tv:run
```

See [local preview instructions](docs/local-preview.md) for prerequisites and controls.

## Usage

Open **Settings**, choose **Local receiver**, and enter the host root of your feeder. The app discovers common PiAware/dump1090/readsb data paths. Use Direct mode when supported; the included local proxy handles browser CORS otherwise. Add fallback coordinates only if the receiver omits its location.

Explore with arrow keys and Enter, or click in the browser. Select an aircraft to inspect, track, or log it. Alerts run while the app is open. Settings → Aircraft details enables free online registration, model, registered owner/operator and photo lookups. No account is needed. Live positions and any routes still come from your receiver. See [aircraft details and providers](docs/aircraft-details.md).

Read the [Tailvision feature comparison](docs/tailvision-parity.md) for TV adaptations and local-data limitations.

## Documentation

Full documentation lives in [`docs/`](docs/index.md):
[Quickstart](docs/quickstart.md) · [Installation](docs/installation.md) · [Configuration](docs/configuration.md) · [Architecture](docs/architecture.md) · [API](docs/api.md) · [Development](docs/development.md) · [FAQ](docs/faq.md) · [Troubleshooting](docs/troubleshooting.md) · [Roadmap](docs/roadmap.md)

## Support

Open a [GitHub Discussion](https://github.com/willtheorangeguy/adsb-tvos/discussions/new) or file an [issue](https://github.com/willtheorangeguy/adsb-tvos/issues/new/choose).

## Contributing

Contributions welcome. See the org-wide [Contributing Guide](https://github.com/willtheorangeguy/.github/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/willtheorangeguy/.github/blob/main/CODE_OF_CONDUCT.md).

## Credits

Data from a local [PiAware](https://flightaware.com/adsb/piaware/) feeder. Built with [React](https://react.dev/), [Vite](https://vitejs.dev/), [Leaflet](https://leafletjs.com/), and [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos).

## License

MIT — see [`LICENSE.md`](LICENSE.md).

> Reads your own receiver on your own network. No FlightAware account or API key is involved. Optional maps load OpenStreetMap tiles; optional online aircraft details use adsbdb and Planespotters.net.
