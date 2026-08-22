# ADS-B TV Viewer — Configuration

Two surfaces, two sets of environment variables.

## Proxy

| Variable | Meaning |
|---|---|
| `PIAWARE_BASE_URL` | The **host root** of your feeder |
| `PORT` | Port the proxy listens on. Default `7070` |

### `PIAWARE_BASE_URL` — the one that goes wrong

It wants the host root and nothing else:

```ini
PIAWARE_BASE_URL=http://piaware.local
```

Three ways people get it wrong:

- **Including `/skyaware/`.** That is the browser UI path. Take your SkyAware URL and drop it.
- **Using port `30005`.** That is the Beast binary feed, not the JSON API.
- **Adding a data path.** The proxy appends those itself.

Get this wrong and the proxy starts cleanly and returns nothing useful, which is why it is
worth checking first when the map is empty.

## Web app

| Variable | Meaning |
|---|---|
| `VITE_PIAWARE_MODE` | `proxy` or `direct` |
| `VITE_PIAWARE_BASE_URL` | The proxy URL in proxy mode, or the feeder URL in direct mode |
| `VITE_POLL_MS` | Refresh interval in milliseconds. Default `2000` |

`proxy` mode is the default recommendation — see [FAQ](./faq.md) for why browsers usually
need it.

## Which file

The README historically pointed at `apps/web/.env.local`, and the repository tracks
`apps/web/.env`. Vite reads both, with `.env.local` taking precedence.

Prefer **`.env.local`** for anything specific to your setup: it is the conventional name for
machine-local overrides and is normally kept out of version control. The tracked `.env` files
currently hold defaults rather than secrets — see
[`internal/known-issues.md`](./internal/known-issues.md) for why that distinction matters.

## Polling

`VITE_POLL_MS` at `2000` refreshes twice a second's worth of positions. Lowering it makes the
map smoother and asks more of a Raspberry Pi that is also decoding radio; raising it is
gentler and makes fast aircraft jump between updates.

## No credentials anywhere

There is no API key, no account, and no third-party service. The feeder is yours and it is on
your network — which is the whole reason this project reads it directly.
