import type {PiAwareAircraftRecord} from '@adsb/shared';

// A synthetic PiAware feed for running in the simulator, where no real feeder
// is reachable. It returns a `fetch`-compatible function that answers the same
// endpoints the proxy exposes (`/api/aircraft`, `/api/receiver`) with data that
// evolves over time, so the app exercises the real PiAware client + tracker
// code path end to end.

const RECEIVER = {lat: 37.6188, lon: -122.375};

interface DemoPlane {
  record: PiAwareAircraftRecord;
  lat: number;
  lon: number;
}

const CALLSIGNS = [
  ['UAL1234', 'A1B2C3', 'N12345', 'A320'],
  ['SWA221', 'B4D5E6', 'N221WN', 'B738'],
  ['DAL88', 'C7F8A9', 'N88DL', 'B763'],
  ['ASA512', 'D1E2F3', 'N512AS', 'B739'],
  ['AAL9', 'E4A5B6', 'N9AA', 'A321'],
  ['FDX1301', 'F7C8D9', 'N1301F', 'B77L'],
  ['JBU615', 'A2C3E4', 'N615JB', 'A320'],
  ['SKW5490', 'B5D6F7', 'N5490', 'E75L'],
  ['ACA795', 'C8A9B1', 'C-FANG', 'B788'],
  ['NKS440', 'D3E4F5', 'N440NK', 'A20N'],
  ['HAL22', 'E6A7B8', 'N22HA', 'A332'],
  ['VOI901', 'F9C1D2', 'XA-VOI', 'A321'],
];

function seededPlanes(): DemoPlane[] {
  return CALLSIGNS.map(([flight, hex, reg, category], index) => {
    const bearing = (index / CALLSIGNS.length) * 360;
    const rangeNm = 6 + (index % 5) * 8;
    const bearingRad = (bearing * Math.PI) / 180;
    const lat = RECEIVER.lat + (rangeNm * Math.cos(bearingRad)) / 60;
    const lon =
      RECEIVER.lon +
      (rangeNm * Math.sin(bearingRad)) / (60 * Math.cos((RECEIVER.lat * Math.PI) / 180));

    return {
      lat,
      lon,
      record: {
        hex,
        flight,
        reg,
        category,
        squawk: (1200 + index * 7).toString().padStart(4, '0'),
        alt_baro: 8_000 + index * 2_500,
        gs: 240 + ((index * 37) % 200),
        track: (bearing + 90) % 360,
        baro_rate: index % 3 === 0 ? 1_200 : index % 3 === 1 ? -800 : 0,
        rssi: -6 - (index % 8),
        messages: 500 + index * 120,
        seen: 0,
      },
    };
  });
}

export function createDemoFetch(): typeof fetch {
  const planes = seededPlanes();
  let lastTickMs = Date.now();

  const advance = () => {
    const nowMs = Date.now();
    const dtSeconds = Math.min(5, (nowMs - lastTickMs) / 1000);
    lastTickMs = nowMs;

    for (const plane of planes) {
      const gs = plane.record.gs ?? 0;
      const track = plane.record.track ?? 0;
      const distanceNm = (gs * dtSeconds) / 3600;
      const trackRad = (track * Math.PI) / 180;
      plane.lat += (distanceNm * Math.cos(trackRad)) / 60;
      plane.lon +=
        (distanceNm * Math.sin(trackRad)) / (60 * Math.cos((plane.lat * Math.PI) / 180));

      // Gently curve the tracks so trails are visible and the scene stays lively.
      plane.record.track = (track + dtSeconds * 1.5) % 360;

      const altitude = typeof plane.record.alt_baro === 'number' ? plane.record.alt_baro : 10_000;
      const rate = plane.record.baro_rate ?? 0;
      plane.record.alt_baro = Math.max(1_000, altitude + (rate * dtSeconds) / 60);
      plane.record.lat = plane.lat;
      plane.record.lon = plane.lon;
      plane.record.seen = Math.random() * 1.5;
    }
  };

  const respond = (payload: unknown): Response =>
    ({
      ok: true,
      status: 200,
      json: async () => payload,
    } as unknown as Response);

  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Match both proxy (/api/receiver) and direct (/skyaware/data/receiver.json)
    // endpoint styles so demo mode works regardless of the connection mode.
    if (url.includes('receiver')) {
      return respond({lat: RECEIVER.lat, lon: RECEIVER.lon, version: 'demo-1.0'});
    }

    if (url.includes('aircraft')) {
      advance();
      return respond({
        now: Date.now() / 1000,
        messages: 100_000,
        aircraft: planes.map((plane) => ({...plane.record})),
      });
    }

    // history and anything else: behave like the proxy's 404 for unknown paths.
    return {ok: false, status: 404, json: async () => ({})} as unknown as Response;
  }) as typeof fetch;
}
