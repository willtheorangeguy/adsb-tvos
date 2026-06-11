import { describe, expect, it } from "vitest";

import { approximateLocationFromAircraft, mergeTrackingState } from "./tracker.js";

import type { TrackedAircraft } from "./types.js";

function trackedAt(hex: string, position?: { lat: number; lon: number }): TrackedAircraft {
  return {
    hex,
    position,
    ageSeconds: 0,
    lastSeenMs: 0,
    stale: false,
    trail: [],
  };
}

describe("mergeTrackingState", () => {
  it("maintains per-aircraft trail history", () => {
    const first = mergeTrackingState(
      undefined,
      {
        sourceTimestampMs: 1_000,
        aircraft: [{ hex: "abc123", lat: 40, lon: -75, seen: 0 }],
      },
      { maxTrailPoints: 10 },
      { lat: 40, lon: -75 },
    );

    const second = mergeTrackingState(
      first,
      {
        sourceTimestampMs: 2_000,
        aircraft: [{ hex: "abc123", lat: 40.01, lon: -75.01, seen: 0 }],
      },
      { maxTrailPoints: 10 },
      { lat: 40, lon: -75 },
    );

    expect(second.aircraft[0]?.trail).toHaveLength(2);
    expect(second.aircraft[0]?.distanceNm).toBeGreaterThan(0);
  });
});

describe("approximateLocationFromAircraft", () => {
  it("returns undefined when no aircraft report a position", () => {
    expect(approximateLocationFromAircraft([])).toBeUndefined();
    expect(approximateLocationFromAircraft([trackedAt("abc123")])).toBeUndefined();
  });

  it("estimates a location near a cluster of aircraft", () => {
    // Aircraft clustered around Calgary International Airport (~51.13, -114.02).
    const aircraft = [
      trackedAt("a", { lat: 51.1, lon: -114.0 }),
      trackedAt("b", { lat: 51.15, lon: -114.05 }),
      trackedAt("c", { lat: 51.2, lon: -113.95 }),
    ];

    const location = approximateLocationFromAircraft(aircraft);

    expect(location?.lat).toBeCloseTo(51.15, 1);
    expect(location?.lon).toBeCloseTo(-114.0, 1);
  });

  it("is not dragged away by a single far-off aircraft", () => {
    const aircraft = [
      trackedAt("a", { lat: 51.1, lon: -114.0 }),
      trackedAt("b", { lat: 51.15, lon: -114.05 }),
      trackedAt("c", { lat: 51.2, lon: -113.95 }),
      trackedAt("outlier", { lat: 25.0, lon: -80.0 }),
    ];

    const location = approximateLocationFromAircraft(aircraft);

    expect(location?.lat).toBeGreaterThan(50);
    expect(location?.lon).toBeLessThan(-113);
  });
});
