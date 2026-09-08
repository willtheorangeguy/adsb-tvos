# Online aircraft details

Settings → Aircraft details → **Online details** enables free, keyless lookups for the selected real aircraft. **Local only** disables lookups and removes online details. Demo traffic never calls these services. No login or subscription is needed for the implemented providers.

| Provider | Used for | Why chosen |
|---|---|---|
| [adsbdb](https://github.com/mrjackwills/adsbdb) | Registration, manufacturer/model, ICAO type, registered owner/operator | Public aircraft endpoint, no key, browser CORS support |
| [Planespotters.net](https://www.planespotters.net/photo/api) | Aircraft thumbnail and photographer/source attribution | Explicitly free public photo API; supports browser and device clients |
| [hexdb](https://hexdb.io/) | Evaluated alternative; not called by the app | Similar registry fields; unnecessary to duplicate requests with adsbdb working |

The app sends the selected aircraft’s six-digit ICAO hex to both providers, and downloads a returned thumbnail from Planespotters’ CDN. It does not send receiver coordinates, receiver address, callsigns, or flight history to these APIs. Providers see the requesting device’s public IP as with any network request. Live positions, altitude, speed, heading and trails always come from the local receiver.

Registry ownership does not establish who operates a particular flight. Feed-supplied operator names take priority; registry fallback is explicitly labeled **Registered owner / operator · adsbdb**. Registry details can be incomplete or outdated. Routes remain receiver-supplied; the adsbdb route endpoint is not used.

Lookups wait 350 ms after selection, share in-flight requests, and cache JSON in memory (up to 128 aircraft, one hour for successful results; one minute for empty/failed results). The selected aircraft is rechecked once a minute through this cache. HTTP failures trigger a provider-wide cooldown of at least one minute; `Retry-After` is honored. Requests time out after six seconds. Disabling online details aborts active requests and discards the cache. Missing results and API outages leave local tracking running.

## Photo attribution and handling

Per the [photo API terms](https://www.planespotters.net/photo/api), photos remain free to all app users, carry visible photographer credit, and use the exact API thumbnail/source URLs. The browser thumbnail is a plain link to the original photo. Apple TV displays an adjacent QR code to the same page. Only API thumbnails are displayed; no full-resolution scraping, image proxy, photo export, or photo persistence is implemented. Photo metadata is not included in saved sightings.

Native requests identify the app with `ADSB-TV/0.1 (+https://github.com/willtheorangeguy/adsb-tvos)`. Browser requests use normal browser Origin/Referer headers. Native thumbnails download directly into a dedicated image view using an ephemeral URL session without a disk or React Native image cache. API JSON is held only in memory for at most one hour, below the provider’s 24-hour limit.

These are community services with coverage and availability limits, not guaranteed flight-operation data. Provider terms were reviewed and real API responses tested on September 7, 2026. Paid providers and credential storage are unnecessary for this implementation; any future account-based integration should define its actual authentication flow before adding credential fields.
