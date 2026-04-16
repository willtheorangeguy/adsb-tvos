import type { TrackedAircraft } from "./types.js";

function formatNumber(value: number | undefined, digits = 0): string {
  return typeof value === "number" ? value.toFixed(digits) : "--";
}

export function formatAltitude(aircraft: TrackedAircraft): string {
  if (typeof aircraft.altitudeFt !== "number") {
    return "--";
  }

  return `${Math.round(aircraft.altitudeFt).toLocaleString()} ft`;
}

export function formatSpeed(aircraft: TrackedAircraft): string {
  if (typeof aircraft.groundSpeedKt !== "number") {
    return "--";
  }

  return `${Math.round(aircraft.groundSpeedKt)} kt`;
}

export function formatTrack(aircraft: TrackedAircraft): string {
  if (typeof aircraft.trackDeg !== "number") {
    return "--";
  }

  return `${Math.round(aircraft.trackDeg)}°`;
}

export function formatDistance(aircraft: TrackedAircraft): string {
  if (typeof aircraft.distanceNm !== "number") {
    return "--";
  }

  return `${formatNumber(aircraft.distanceNm, 1)} nm`;
}
