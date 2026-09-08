import type { LatLon, TrackedAircraft } from "./types.js";

export interface WatchRule {
  id: string;
  kind: "aircraft" | "type" | "category";
  value: string;
  label: string;
}
export interface Sighting {
  id: string;
  savedAt: number;
  demo: boolean;
  aircraft: TrackedAircraft;
}
export interface Proximity {
  bearing: number;
  direction: string;
  closestNm?: number;
  minutes?: number;
}

export function proximity(
  plane: TrackedAircraft,
  receiver?: LatLon
): Proximity | undefined {
  if (!plane.position || !receiver) return undefined;
  const rad = Math.PI / 180;
  const east =
    (plane.position.lon - receiver.lon) * 60 * Math.cos(receiver.lat * rad);
  const north = (plane.position.lat - receiver.lat) * 60;
  const bearing = (Math.atan2(east, north) / rad + 360) % 360;
  const result: Proximity = {
    bearing,
    direction: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
      Math.round(bearing / 45) % 8
    ]!,
  };
  if (
    plane.trackDeg === undefined ||
    !plane.groundSpeedKt ||
    plane.groundSpeedKt < 20
  )
    return result;
  const vx = (Math.sin(plane.trackDeg * rad) * plane.groundSpeedKt) / 60;
  const vy = (Math.cos(plane.trackDeg * rad) * plane.groundSpeedKt) / 60;
  const minutes = -(east * vx + north * vy) / (vx * vx + vy * vy);
  if (minutes >= 0 && minutes <= 30) {
    result.minutes = minutes;
    result.closestNm = Math.hypot(east + vx * minutes, north + vy * minutes);
  }
  return result;
}

export function aircraftCategory(plane: TrackedAircraft): string {
  const category = plane.category;
  if (category === "A7") return "Helicopter";
  if (category === "A1") return "Light";
  if (["A2", "A3", "A4", "A5"].includes(category ?? "")) return "Large";
  return "Other";
}

export function matchesWatch(plane: TrackedAircraft, rule: WatchRule): boolean {
  const value = rule.value.toUpperCase();
  if (rule.kind === "aircraft")
    return plane.hex === value || plane.registration?.toUpperCase() === value;
  if (rule.kind === "type") return plane.aircraftType?.toUpperCase() === value;
  return aircraftCategory(plane).toUpperCase() === value;
}

export function nearbyAlerts(
  aircraft: TrackedAircraft[],
  rules: WatchRule[],
  radiusNm: number
): TrackedAircraft[] {
  return aircraft.filter(
    (p) =>
      !p.stale &&
      p.distanceNm !== undefined &&
      p.distanceNm <= radiusNm &&
      rules.some((r) => matchesWatch(p, r))
  );
}

export function sightingText(sighting: Sighting): string {
  const p = sighting.aircraft;
  return `${sighting.demo ? "[DEMO] " : ""}${p.callsign || p.hex} · ${
    p.registration || p.hex
  }\n${p.aircraftType || "Type unavailable"} · ${
    p.altitudeFt === undefined
      ? "Altitude unavailable"
      : Math.round(p.altitudeFt).toLocaleString() + " ft"
  } · ${p.groundSpeedKt ?? "—"} kt\nSpotted ${new Date(
    sighting.savedAt
  ).toISOString()}${
    p.position
      ? `\n${p.position.lat.toFixed(5)}, ${p.position.lon.toFixed(5)}`
      : ""
  }\nADS-B TV · My local sky`;
}
