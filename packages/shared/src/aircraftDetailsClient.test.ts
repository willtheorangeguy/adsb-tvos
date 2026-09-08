import { describe, expect, it, vi } from "vitest";
import {
  createAircraftDetailsClient,
  parseIdentity,
  parsePhoto,
} from "./aircraftDetailsClient.js";
const aircraft = {
  response: {
    aircraft: {
      mode_s: "C07F47",
      registration: "C-GWFE",
      manufacturer: "Bombardier",
      type: "DHC-8 402",
      icao_type: "DH8D",
      registered_owner: "WestJet Encore",
      lat: 99,
    },
  },
};
const photos = {
  photos: [
    {
      thumbnail_large: { src: "https://t.plnspttrs.net/example_280.jpg" },
      photographer: "Photographer",
      link: "https://www.planespotters.net/photo/123?utm_source=api",
    },
  ],
};
describe("optional online aircraft details", () => {
  it("validates identity and keeps registered ownership separate from live operator and position", () => {
    expect(parseIdentity(aircraft, "c07f47")).toEqual({
      registration: "C-GWFE",
      aircraftType: "DH8D",
      description: "Bombardier DHC-8 402",
      registeredOwner: "WestJet Encore",
    });
    expect(parseIdentity(aircraft, "ABC123")).toBeUndefined();
    expect(parseIdentity(null, "ABC123")).toBeUndefined();
  });
  it("requires photo attribution and approved URLs, preserving source links verbatim", () => {
    expect(parsePhoto(photos)).toEqual({
      url: photos.photos[0].thumbnail_large.src,
      credit: "© Photographer",
      link: photos.photos[0].link,
    });
    for (const bad of [
      { photographer: "" },
      { link: "https://evil.test/photo/123" },
      { thumbnail_large: { src: "http://t.plnspttrs.net/photo.jpg" } },
    ]) {
      expect(
        parsePhoto({ photos: [{ ...photos.photos[0], ...bad }] })
      ).toBeUndefined();
    }
  });
  it("deduplicates in-flight work, caches by hex and expires cached JSON", async () => {
    let now = 0;
    const fetcher = vi.fn(
      async (url: string | URL | Request) =>
        new Response(
          JSON.stringify(String(url).includes("adsbdb") ? aircraft : photos)
        )
    );
    const client = createAircraftDetailsClient({
      fetch: fetcher,
      now: () => now,
    });
    const [one, two] = await Promise.all([
      client.lookup("c07f47"),
      client.lookup("C07F47"),
    ]);
    expect(one).toEqual(two);
    expect(one.photo).toBeDefined();
    await client.lookup("C07F47");
    expect(fetcher).toHaveBeenCalledTimes(2);
    now = 3600001;
    await client.lookup("C07F47");
    expect(fetcher).toHaveBeenCalledTimes(4);
    client.dispose();
  });
  it("keeps partial results and honors Retry-After across different aircraft", async () => {
    let now = 0;
    const fetcher = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("adsbdb")
        ? new Response(JSON.stringify(aircraft))
        : new Response("", { status: 429, headers: { "Retry-After": "120" } })
    );
    const client = createAircraftDetailsClient({
      fetch: fetcher,
      now: () => now,
    });
    const result = await client.lookup("C07F47");
    expect(result.identity?.registeredOwner).toBe("WestJet Encore");
    expect(result.unavailable).toBe(true);
    await client.lookup("ABC123");
    expect(fetcher).toHaveBeenCalledTimes(3);
    now = 120001;
    await client.lookup("C07F47");
    expect(fetcher).toHaveBeenCalledTimes(5);
    client.dispose();
  });
  it("negative-caches unknown aircraft and ignores non-ICAO addresses", async () => {
    const fetcher = vi.fn(async () => new Response("", { status: 404 }));
    const client = createAircraftDetailsClient({ fetch: fetcher });
    await client.lookup("~123456");
    expect(fetcher).not.toHaveBeenCalled();
    expect(await client.lookup("ABC123")).toEqual({
      identity: undefined,
      photo: undefined,
      unavailable: false,
    });
    await client.lookup("ABC123");
    expect(fetcher).toHaveBeenCalledTimes(2);
    client.dispose();
  });
  it("aborts requests on disposal and never starts more", async () => {
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          signals.push(init!.signal!);
          init!.signal!.addEventListener("abort", () =>
            reject(new Error("aborted"))
          );
        })
    );
    const client = createAircraftDetailsClient({ fetch: fetcher });
    const work = client.lookup("C07F47");
    client.dispose();
    await work;
    expect(signals.every((s) => s.aborted)).toBe(true);
    await client.lookup("ABC123");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
