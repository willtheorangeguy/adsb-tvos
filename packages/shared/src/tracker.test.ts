import { describe, expect, it } from "vitest";

import { mergeTrackingState } from "./tracker.js";

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
