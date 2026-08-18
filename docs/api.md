# ADS-B TV Viewer — Proxy API

`apps/proxy` is a thin forwarder in front of your PiAware feeder. It adds no data of its own.

Full endpoint list and troubleshooting live in
[`apps/proxy/README.md`](../apps/proxy/README.md); this page covers what matters from the
outside.

## What it is for

Two browser constraints, neither of which applies to the tvOS app:

- **Cross-origin requests** to the feeder are blocked by the browser.
- **Mixed content** — a page served over HTTPS may not fetch from a plain-HTTP LAN device.

The proxy runs on the same origin as the dev server and forwards on your behalf.

## Configuration

```
PIAWARE_BASE_URL=http://piaware.local
PORT=7070
```

`PIAWARE_BASE_URL` is the **host root** — no `/skyaware/`, not port `30005`. The proxy appends
the data paths itself. See [Configuration](./configuration.md).

## `GET /` returns "Cannot GET /"

Expected. The proxy exposes data paths, not a landing page — there is nothing at the root and
Express says so. It is not a sign the proxy is broken, which is exactly why it is worth
stating.

## Direct mode

Setting `VITE_PIAWARE_MODE=direct` bypasses the proxy and points the web app at the feeder.
It works when the browser permits it — typically a plain-HTTP dev server on the same network.

Reach for the proxy when direct mode produces console errors about CORS or mixed content.

## Upstream

The feeder's own JSON API, which is PiAware's, not this project's. A change on that side would
need matching in `piawareClient.ts`.

There is no authentication anywhere: the feeder is on your network and expects local clients.
