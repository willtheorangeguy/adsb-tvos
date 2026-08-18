# ADS-B TV Viewer — Roadmap

Known gaps, observed from the repository. Limitations, not a schedule. Concrete defects are in
[`internal/known-issues.md`](./internal/known-issues.md).

## The tvOS app is a scaffold

The Apple TV surface exists as a `react-native-tvos` project with the shared logic wired in,
not as a finished app. Everything it needs to think is tested; what it looks like on a
television is the work remaining.

## Gaps

**The base-URL mistake is undetected.** A wrong `PIAWARE_BASE_URL` produces a proxy that
starts cleanly and returns nothing, which is indistinguishable from a quiet sky. A startup
check that fetches once and reports what it found would turn the most common setup error into
an immediate message.

**No environment template.** There is no `.env.example`, so the required variables have to be
read out of the documentation. See
[`internal/known-issues.md`](./internal/known-issues.md).

**No CI.** There are lint, test, and typecheck scripts and nothing runs them automatically, so
the shared package's tests — the part deliberately made runnable anywhere — are not run on
push.

**Direct mode is under-specified.** It exists and works in some browser and network
combinations, and nothing states which. In practice most people will need the proxy.

**No offline or replay mode.** Development requires a live feeder, so the map cannot be worked
on away from the network the receiver is on. A recorded snapshot to replay would make UI work
possible anywhere — which fits the repository's Windows-first premise.

## Non-goals

- **Aggregating other people's data.** This reads one receiver, yours. Network-wide coverage
  is what FlightAware's own services are for.
- **An API key or account.** Reading your own hardware directly is the point.
- **Building tvOS from Windows.** Apple's toolchain requires macOS; the architecture works
  around that rather than pretending otherwise.
