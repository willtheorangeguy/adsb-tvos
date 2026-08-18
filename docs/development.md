# ADS-B TV Viewer — Development

## Setup

```bash
npm install
```

Root install covers `apps/web`, `apps/proxy`, and `packages/*`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | The web preview (alias of `dev:web`) |
| `npm run dev:web` | Vite dev server for `apps/web` |
| `npm run dev:proxy` | The PiAware proxy |
| `npm run build` | Build every workspace that defines one |
| `npm run lint` | Lint every workspace |
| `npm run test` | Test every workspace |
| `npm run typecheck` | Typecheck every workspace |

All the aggregate scripts use `--workspaces --if-present`, so a workspace without that script
is skipped rather than failing the run.

**None of them touch `apps/tvos`** — it is outside the workspace with its own dependency tree.

## Where to make changes

| Change | Where |
|---|---|
| Tracking, filtering, formatting, models | `packages/shared/src/` |
| Map or web UI | `apps/web` |
| Feeder forwarding | `apps/proxy/src/index.ts` |
| Apple TV UI | `apps/tvos` |

## Put logic in the shared package

The reason this repository is structured as it is: tvOS needs macOS and Xcode to build, so a
Windows machine cannot run the Apple TV app — but it can run everything the app *thinks*
with.

Logic that lands in `apps/web` instead of `packages/shared` becomes untestable from the tvOS
side and has to be written twice. `tracker.test.ts` living next to `tracker.ts` is the pattern
to follow.

## Testing

```bash
npm run test
```

`packages/shared` is where the meaningful tests are, and they need no browser, simulator, or
feeder — which is what makes them runnable in CI and on any OS.

## The macOS boundary

Everything except building and running the tvOS binary works on Windows. For an Apple TV
build you need macOS with Xcode, or a cloud macOS runner.

Plan work accordingly: get behaviour right in `packages/shared` with tests, verify it in the
web preview, and treat the tvOS build as a release step rather than a development loop.

## Environment files

Keep machine-specific values in `.env.local`, which is the conventional name for local
overrides. Note the repository currently tracks `.env` files and `.gitignore` has no rule for
them — see [`internal/known-issues.md`](./internal/known-issues.md) before putting anything
sensitive in one.
