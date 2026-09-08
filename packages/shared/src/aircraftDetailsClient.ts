/** Optional identity/photo enrichment. Never used for live flight telemetry. */
export interface AircraftIdentity {
  registration?: string;
  aircraftType?: string;
  description?: string;
  registeredOwner?: string;
}
export interface AircraftPhoto {
  aspectRatio?: number;
  url: string;
  credit: string;
  link: string;
}
export interface AircraftDetailsResult {
  identity?: AircraftIdentity;
  photo?: AircraftPhoto;
  unavailable: boolean;
}
export const AIRCRAFT_API_USER_AGENT =
  "ADSB-TV/0.1 (+https://github.com/willtheorangeguy/adsb-tvos)";
const string = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim()
    ? value.trim().slice(0, 250)
    : undefined;
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
const allowedUrl = (value: unknown, hosts: string[]): value is string => {
  if (typeof value !== "string") return false;
  // React Native's built-in URL omits hostname/protocol. These API URLs
  // need only an exact HTTPS host and a path; reject credentials/ports/escapes.
  const match = /^https:\/\/([^/?#]+)(\/[^\s\\]*)$/.exec(value);
  return !!match && hosts.includes(match[1]);
};
export function parseIdentity(
  data: unknown,
  hex: string
): AircraftIdentity | undefined {
  const p = object(object(object(data).response).aircraft);
  if (string(p.mode_s)?.toUpperCase() !== hex.toUpperCase()) return undefined;
  return {
    registration: string(p.registration),
    aircraftType: string(p.icao_type),
    description:
      [string(p.manufacturer), string(p.type)].filter(Boolean).join(" ") ||
      undefined,
    registeredOwner: string(p.registered_owner),
  };
}
export function parsePhoto(data: unknown): AircraftPhoto | undefined {
  const photos = object(data).photos;
  if (!Array.isArray(photos)) return undefined;
  for (const item of photos) {
    const p = object(item);
    const url = object(p.thumbnail_large).src ?? object(p.thumbnail).src;
    const credit = string(p.photographer);
    if (
      credit &&
      allowedUrl(url, ["t.plnspttrs.net", "cdn.planespotters.net"]) &&
      allowedUrl(p.link, ["www.planespotters.net"]) &&
      p.link.startsWith("https://www.planespotters.net/photo/")
    ) {
      // Keep API URLs verbatim. Only API thumbnails, never originals.
      const size = object(object(p.thumbnail_large ?? p.thumbnail).size);
      const aspectRatio =
        typeof size.width === "number" &&
        typeof size.height === "number" &&
        size.height > 0
          ? size.width / size.height
          : undefined;
      return {
        url,
        credit: `© ${credit}`,
        link: p.link,
        ...(aspectRatio &&
        Number.isFinite(aspectRatio) &&
        aspectRatio >= 0.25 &&
        aspectRatio <= 4
          ? { aspectRatio }
          : {}),
      };
    }
  }
  return undefined;
}
export function createAircraftDetailsClient(
  options: {
    fetch?: typeof fetch;
    userAgent?: string;
    now?: () => number;
    timeoutMs?: number;
  } = {}
) {
  const fetcher = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const cache = new Map<
    string,
    { expires: number; result: AircraftDetailsResult }
  >();
  const pending = new Map<string, Promise<AircraftDetailsResult>>();
  const controllers = new Set<AbortController>();
  const cooldown = new Map<string, number>();
  let disposed = false;
  async function request(url: string): Promise<unknown> {
    const host = url.split("/")[2];
    if ((cooldown.get(host) ?? 0) > now())
      throw new Error("Provider cooling down");
    const controller = new AbortController();
    controllers.add(controller);
    const timer = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 6000
    );
    try {
      const response = await fetcher(url, {
        signal: controller.signal,
        headers: options.userAgent
          ? { "User-Agent": options.userAgent }
          : undefined,
      });
      if (response.status === 404) return undefined;
      if (!response.ok) {
        const retry = response.headers.get("Retry-After");
        const delay =
          retry && /^\d+$/.test(retry)
            ? Number(retry) * 1000
            : Date.parse(retry ?? "") - now();
        cooldown.set(
          host,
          now() + Math.max(60000, Number.isFinite(delay) ? delay : 0)
        );
        throw new Error(`Provider HTTP ${response.status}`);
      }
      const data: unknown = await response.json();
      if (object(data).error) throw new Error("Provider error");
      return data;
    } catch (error) {
      if (!disposed)
        cooldown.set(host, Math.max(cooldown.get(host) ?? 0, now() + 60000));
      throw error;
    } finally {
      clearTimeout(timer);
      controllers.delete(controller);
    }
  }
  return {
    lookup(hex: string): Promise<AircraftDetailsResult> {
      const key = hex.toUpperCase();
      if (disposed || !/^[0-9A-F]{6}$/.test(key))
        return Promise.resolve({ unavailable: false });
      const cached = cache.get(key);
      if (cached && cached.expires > now())
        return Promise.resolve(cached.result);
      const existing = pending.get(key);
      if (existing) return existing;
      const work = Promise.allSettled([
        request(`https://api.adsbdb.com/v0/aircraft/${key}`),
        request(`https://api.planespotters.net/pub/photos/hex/${key}`),
      ])
        .then(([identity, photo]) => {
          const result: AircraftDetailsResult = {
            identity:
              identity.status === "fulfilled"
                ? parseIdentity(identity.value, key)
                : undefined,
            photo:
              photo.status === "fulfilled"
                ? parsePhoto(photo.value)
                : undefined,
            unavailable:
              identity.status === "rejected" || photo.status === "rejected",
          };
          // JSON only, memory only. Successful entries 1 hour; misses/errors 1 minute.
          if (!disposed) {
            if (cache.size >= 128) cache.delete(cache.keys().next().value!);
            cache.set(key, {
              result,
              expires:
                now() +
                (!result.unavailable && (result.identity || result.photo)
                  ? 3600000
                  : 60000),
            });
          }
          return result;
        })
        .finally(() => pending.delete(key));
      pending.set(key, work);
      return work;
    },
    dispose() {
      disposed = true;
      controllers.forEach((c) => c.abort());
      cache.clear();
      pending.clear();
    },
  };
}
