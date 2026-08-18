# ADS-B TV Viewer — FAQ

## Do I need a FlightAware account or API key?

No. This reads your own PiAware receiver over your own network. Nothing leaves the LAN and
there is no subscription.

That is the difference from `flightaware-cli` in this org, which uses the paid AeroAPI.

## Do I need the proxy?

In a browser, almost always. Two things get in the way of talking to the feeder directly:
cross-origin restrictions, and the rule that an HTTPS page may not fetch from a plain-HTTP LAN
device.

The proxy runs on the same origin as the dev server and sidesteps both. The tvOS app has
neither constraint, which is why the proxy is described as optional.

## Do I need a Mac?

Only to build and run the Apple TV app. Everything else — the web preview, the proxy, the
shared logic and its tests — works on Windows, which is what the repository is arranged
around.

## The map is empty. What is wrong?

Most likely `PIAWARE_BASE_URL`. It wants the **host root**, not the `/skyaware/` path from
your browser and not port `30005`.

After that: confirm the feeder responds, confirm the proxy is running, and remember a receiver
with poor placement genuinely hears nothing sometimes. See
[Troubleshooting](./troubleshooting.md).

## The proxy says "Cannot GET /".

Expected. It exposes data paths, not a landing page. Not a fault.

## Why is `apps/tvos` outside the npm workspace?

React Native's toolchain does not share a dependency tree comfortably with a Vite app. Keeping
it separate is why root scripts skip it.

## How often does it refresh?

`VITE_POLL_MS`, default 2000. Lower is smoother and asks more of a Raspberry Pi that is also
decoding radio; higher is gentler and makes fast aircraft jump between updates.

## Can I run the web app on my phone?

It is a browser app, so yes on the same network. The tvOS app is the one built for a
television.

## Where do environment variables go?

`.env.local` for anything specific to your machine. The repository tracks `.env` files holding
defaults — see [Configuration](./configuration.md).

## Is any of this data private?

It is aircraft transponder data, broadcast publicly and received by your antenna. The only
private thing involved is your feeder's address on your network.
