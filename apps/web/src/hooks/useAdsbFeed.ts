import { useEffect, useMemo, useState } from "react";

import {
  createPiAwareClient,
  filterAndSortAircraft,
  mergeTrackingState,
  receiverFromPayload,
  type AircraftFilters,
  type TrackingState,
  type TrackedAircraft,
} from "@adsb/shared";

import type { AppConfig } from "../config";

export interface FeedState {
  loading: boolean;
  error?: string;
  asOfMs?: number;
  receiver?: { lat: number; lon: number };
  allAircraft: TrackedAircraft[];
  aircraft: TrackedAircraft[];
}

export function useAdsbFeed(config: AppConfig, filters: AircraftFilters): FeedState {
  const [trackingState, setTrackingState] = useState<TrackingState>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const client = useMemo(
    () =>
      createPiAwareClient({
        mode: config.mode,
        baseUrl: config.baseUrl,
      }),
    [config.baseUrl, config.mode],
  );

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const [snapshot, receiverPayload] = await Promise.all([
          client.getAircraftSnapshot(),
          client.getReceiver(),
        ]);

        if (cancelled) {
          return;
        }

        setTrackingState((previous) =>
          mergeTrackingState(previous, snapshot, { staleAfterMs: 20_000, maxTrailPoints: 24 }, receiverFromPayload(receiverPayload)),
        );
        setError(undefined);
      } catch (caughtError) {
        if (!cancelled) {
          const message =
            caughtError instanceof Error ? caughtError.message : "Failed to read PiAware feed";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void poll();
    const timerId = window.setInterval(() => {
      void poll();
    }, config.pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [client, config.pollMs]);

  const allAircraft = useMemo(() => trackingState?.aircraft ?? [], [trackingState?.aircraft]);
  const aircraft = useMemo(
    () => filterAndSortAircraft(allAircraft, filters),
    [allAircraft, filters],
  );

  return {
    loading,
    error,
    asOfMs: trackingState?.asOfMs,
    receiver: trackingState?.receiver,
    allAircraft,
    aircraft,
  };
}
