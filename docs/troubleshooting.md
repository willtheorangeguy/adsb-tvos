# ADS-B TV Viewer — Troubleshooting

## The map is empty

Work through these in order — the first accounts for most cases.

### 1. Check `PIAWARE_BASE_URL`

It wants the **host root** of your feeder:

```ini
PIAWARE_BASE_URL=http://piaware.local
```

Not `http://piaware.local/skyaware/` — that is the browser UI path. Not port `30005` — that is
the Beast binary feed, not JSON. The proxy appends data paths itself.

Get this wrong and the proxy starts cleanly and quietly returns nothing, which is why it looks
like an application fault rather than a configuration one.

### 2. Confirm the feeder is answering

Open its SkyAware page in a browser. If that is empty too, the problem is upstream of this
project.

### 3. Confirm the proxy is running and the app is pointed at it

```bash
npm run dev:proxy
```

and `VITE_PIAWARE_MODE=proxy` with `VITE_PIAWARE_BASE_URL` set to the proxy's address.

### 4. Consider that the sky is empty

A receiver with poor placement, or a quiet period, genuinely hears nothing. Check against the
feeder's own page before assuming a bug.

## CORS errors in the browser console

Use the proxy. A browser will not let a page fetch cross-origin from your feeder, and this is
exactly what the proxy exists for.

## "Blocked loading mixed active content"

The page is on HTTPS and the feeder is plain HTTP. Browsers refuse that combination. Use the
proxy, or serve the dev app over plain HTTP.

## `Cannot GET /` from the proxy

Expected — it exposes data paths, not a landing page. Not a fault.

## The proxy starts but forwards nothing

Almost always the base URL again. `apps/proxy/README.md` has the endpoint list, which is worth
comparing against what your feeder actually serves.

## Aircraft jump between positions

`VITE_POLL_MS` is too high for how fast things are moving. Lower it — at the cost of more
requests to a Raspberry Pi that is also decoding radio.

## `npm run test` skips a workspace

By design. The aggregate scripts use `--workspaces --if-present`, so a workspace without that
script is skipped rather than failing.

## tvOS commands do nothing from the root

`apps/tvos` is outside the npm workspace with its own dependency tree, so root scripts do not
reach it. Building it needs macOS and Xcode — see [Development](./development.md).
