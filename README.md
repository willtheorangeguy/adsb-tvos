<!-- Logo -->
<h1 align="center">ADS-B TV Viewer</h1>

<!-- Copy -->
<h4 align="center">An Apple TV ADS-B viewer for your own PiAware feeder — developed and previewed on Windows, released from macOS.</h4>

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

- Live aircraft from your own FlightAware PiAware feeder — no third-party API, no account.
- A Leaflet map preview that runs in any browser on any OS.
- An optional local proxy that solves the CORS and mixed-content problems browsers create.
- Tracking, filtering, and formatting logic shared between the web preview and the tvOS app.
- A tvOS scaffold for Apple TV, with the shared logic already testable from Windows.

## Installation

```bash
npm install
npm run dev:proxy    # optional, recommended for browsers
npm run dev:web
```

Then open the Vite URL. See [`docs/quickstart.md`](docs/quickstart.md).

## Usage

Point the proxy at your feeder's host root, start the web preview, and aircraft appear on the map as your receiver hears them.

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

> Reads your own receiver on your own network. Nothing is sent anywhere, and no FlightAware account or API key is involved.
