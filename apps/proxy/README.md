# PiAware proxy

A tiny Express server that fetches JSON from your PiAware/SkyAware feeder and
re-serves it with permissive CORS headers, so the web app can read it from a
browser without cross-origin errors.

## Run it

```bash
npm run dev          # from apps/proxy (tsx watch)
# or from the repo root:
npm run dev:proxy
```

It listens on `http://localhost:7070` by default.

## Configuration (`apps/proxy/.env`)

```ini
PIAWARE_BASE_URL=http://192.168.68.137
PORT=7070
```

### `PIAWARE_BASE_URL` — read this carefully

This must be the **host root** of your feeder, *not* the SkyAware page URL and
*not* a raw data port. The proxy appends the SkyAware data paths itself
(e.g. `/skyaware/data/aircraft.json`).

To find the right value, take the SkyAware web UI URL you open in your browser
and **remove the trailing `/skyaware/`**:

| SkyAware UI in your browser            | `PIAWARE_BASE_URL`            |
| -------------------------------------- | ---------------------------- |
| `http://192.168.68.137/skyaware/`      | `http://192.168.68.137`      |
| `http://192.168.68.137:8080/skyaware/` | `http://192.168.68.137:8080` |
| `http://piaware.local/skyaware/`       | `http://piaware.local`       |

Common mistakes:

- ❌ `http://192.168.68.137:30005` — port `30005` is dump1090's raw **Beast
  binary** TCP output, not an HTTP/JSON server.
- ❌ `http://192.168.68.137/skyaware/` — including `/skyaware/` makes the proxy
  request the doubled path `/skyaware/skyaware/data/aircraft.json`.

## Endpoints

The proxy exposes only these routes:

| Route            | Upstream                          |
| ---------------- | --------------------------------- |
| `/`              | proxy info + endpoint list        |
| `/api/health`    | proxy status + configured upstream |
| `/api/aircraft`  | `/skyaware/data/aircraft.json`    |
| `/api/receiver`  | `/skyaware/data/receiver.json`    |
| `/api/history`   | `/skyaware/data/history_0.json`   |

## Troubleshooting

- **`Cannot GET /…`** comes from the proxy (Express 404), meaning you hit a path
  it doesn't define. Use one of the routes above — e.g.
  `http://localhost:7070/api/aircraft`.
- **`502` with an error message** means the proxy reached out to the upstream but
  the request failed. Check `PIAWARE_BASE_URL` against the table above, and
  confirm the JSON loads directly in your browser, e.g.
  `http://192.168.68.137/skyaware/data/aircraft.json`.
- After editing `.env`, restart the dev server so the new value is picked up.
