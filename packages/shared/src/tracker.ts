import type {
  AircraftSnapshot,
  AircraftTrackPoint,
  LatLon,
  PiAwareAircraftRecord,
  TrackerOptions,
  TrackedAircraft,
  TrackingState,
} from "./types.js";

const FEET_PER_NM = 6076.12;

function toPosition(record: PiAwareAircraftRecord): LatLon | undefined {
  if (typeof record.lat !== "number" || typeof record.lon !== "number") {
    return undefined;
  }

  return {
    lat: record.lat,
    lon: record.lon,
  };
}

function toAltitudeFt(value: PiAwareAircraftRecord["alt_baro"]): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  return undefined;
}

function toTrackPoint(position: LatLon, timestampMs: number): AircraftTrackPoint {
  return {
    ...position,
    timestampMs,
  };
}

function distanceNm(from: LatLon, to: LatLon): number {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const earthRadiusNm = 3440.065;

  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * earthRadiusNm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nextTrail(
  previousTrail: AircraftTrackPoint[],
  position: LatLon | undefined,
  timestampMs: number,
  maxTrailPoints: number,
): AircraftTrackPoint[] {
  if (!position) {
    return previousTrail;
  }

  const latest = previousTrail[previousTrail.length - 1];
  const incoming = toTrackPoint(position, timestampMs);
  const sameAsLatest = latest && latest.lat === incoming.lat && latest.lon === incoming.lon;

  const trail = sameAsLatest ? previousTrail : [...previousTrail, incoming];
  return trail.slice(Math.max(0, trail.length - maxTrailPoints));
}

export function mergeTrackingState(
  previous: TrackingState | undefined,
  snapshot: AircraftSnapshot,
  options: TrackerOptions = {},
  receiver?: LatLon,
): TrackingState {
  const staleAfterMs = options.staleAfterMs ?? 20_000;
  const maxTrailPoints = options.maxTrailPoints ?? 20;
  const previousByHex = new Map(previous?.aircraft.map((item) => [item.hex, item]));

  const aircraft: TrackedAircraft[] = snapshot.aircraft.map((record) => {
    const hex = record.hex.trim().toUpperCase();
    const prior = previousByHex.get(hex);
    const position = toPosition(record);
    const ageSeconds = typeof record.seen === "number" ? record.seen : 0;
    const lastSeenMs = snapshot.sourceTimestampMs - ageSeconds * 1000;

    const tracked: TrackedAircraft = {
      hex,
      callsign: record.flight?.trim() || undefined,
      squawk: record.squawk || undefined,
      registration: record.reg || undefined,
      category: record.category || undefined,
      position,
      altitudeFt: toAltitudeFt(record.alt_baro),
      groundSpeedKt: record.gs,
      trackDeg: record.track,
      verticalRateFpm: record.baro_rate,
      navHeadingDeg: record.nav_heading,
      rssi: record.rssi,
      messages: record.messages,
      ageSeconds,
      lastSeenMs,
      stale: snapshot.sourceTimestampMs - lastSeenMs > staleAfterMs,
      trail: nextTrail(prior?.trail ?? [], position, snapshot.sourceTimestampMs, maxTrailPoints),
    };

    if (receiver && position) {
      tracked.distanceNm = distanceNm(receiver, position);
    }

    return tracked;
  });

  aircraft.sort((left, right) => {
    const leftDistance = left.distanceNm ?? Number.POSITIVE_INFINITY;
    const rightDistance = right.distanceNm ?? Number.POSITIVE_INFINITY;
    return leftDistance - rightDistance;
  });

  return {
    asOfMs: snapshot.sourceTimestampMs,
    receiver,
    aircraft,
  };
}

function median(sortedValues: number[]): number {
  const middle = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middle - 1]! + sortedValues[middle]!) / 2;
  }

  return sortedValues[middle]!;
}

/**
 * Estimates the receiver's approximate location from the aircraft it is tracking.
 *
 * Uses the median latitude/longitude so a single far-off aircraft cannot drag the
 * estimate away from the cluster of traffic near the receiver. Returns undefined
 * when no aircraft report a position.
 */
export function approximateLocationFromAircraft(aircraft: TrackedAircraft[]): LatLon | undefined {
  const positions = aircraft
    .map((item) => item.position)
    .filter((position): position is LatLon => position !== undefined);

  if (positions.length === 0) {
    return undefined;
  }

  const lats = positions.map((position) => position.lat).sort((left, right) => left - right);
  const lons = positions.map((position) => position.lon).sort((left, right) => left - right);

  return {
    lat: median(lats),
    lon: median(lons),
  };
}

export function receiverFromPayload(payload: unknown): LatLon | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const candidate = payload as { lat?: unknown; lon?: unknown };

  if (typeof candidate.lat !== "number" || typeof candidate.lon !== "number") {
    return undefined;
  }

  return {
    lat: candidate.lat,
    lon: candidate.lon,
  };
}

export function altitudeToFlightLevel(altitudeFt: number | undefined): string {
  if (typeof altitudeFt !== "number") {
    return "--";
  }

  return `FL${Math.round(altitudeFt / 100).toString().padStart(3, "0")}`;
}

export function verticalSeparationNm(altitudeA: number, altitudeB: number): number {
  return Math.abs(altitudeA - altitudeB) / FEET_PER_NM;
}
