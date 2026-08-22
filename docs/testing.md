# Testing

Vitest covers shared tracking behavior and Apple TV focus navigation. CI also validates linting, type checking, workspace builds, and the browser preview.

## Test stack

| Tool | Purpose |
|---|---|
| Vitest | Unit tests for shared tracking and tvOS focus navigation |
| TypeScript | Static checks for root workspaces and the tvOS project |
| ESLint | React, TypeScript, and hooks linting where a lint script is defined |
| Playwright | Captures a built web preview as a CI artifact |

## Running the tests

From the repository root, run tests for every workspace that defines a test script:

```bash
npm run test
```

The current root test suite runs `packages/shared/src/tracker.test.ts`. Test the native project separately:

```bash
cd apps/tvos
npm test
```

## Run one test file

Run a shared test directly through its workspace:

```bash
npm exec --workspace @adsb/shared vitest run src/tracker.test.ts
```

Run the focus-navigation file from `apps/tvos`:

```bash
npx vitest run src/focusNavigation.test.ts
```

## Test layout

```text
packages/shared/src/tracker.test.ts       snapshot merging and receiver estimation
apps/tvos/src/focusNavigation.test.ts    Apple TV directional focus transitions
```

Tests sit beside the source they cover and use `.test.ts` filenames. Shared tests construct PiAware-shaped data in memory, so they do not require a live feeder. Focus-navigation tests use plain state objects and do not require a simulator.

## Writing new tests

Add platform-neutral behavior and its tests under `packages/shared/src`. Add tvOS-only state tests beside the corresponding file in `apps/tvos/src`. Keep network access behind the fetch-compatible interface accepted by `createPiAwareClient`; the demo feed already demonstrates that boundary.

No coverage threshold or coverage command is configured.

{{ support() }}
