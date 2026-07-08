import {useEffect, useMemo, useState} from 'react';

import {
  createPiAwareClient,
  filterAndSortAircraft,
  mergeTrackingState,
  receiverFromPayload,
  type AircraftFilters,
  type LatLon,
  type TrackingState,
  type TrackedAircraft,
} from '@adsb/shared';

import type {AppConfig} from './config';
import {createDemoFetch} from './demoFeed';

export interface FeedState {
  loading: boolean;
  error?: string;
  asOfMs?: number;
  receiver?: LatLon;
  allAircraft: TrackedAircraft[];
  aircraft: TrackedAircraft[];
}

// Port of the web app's useAdsbFeed, using the same shared PiAware client and
// tracker. In demo mode the client is fed a synthetic fetch implementation so
// the simulator shows live-looking traffic without a real feeder.
export function useAdsbFeed(config: AppConfig, filters: AircraftFilters): FeedState {
  const [trackingState, setTrackingState] = useState<TrackingState>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const client = useMemo(
    () =>
      createPiAwareClient({
        mode: config.mode,
        baseUrl: config.baseUrl,
        fetchImpl: config.demo ? createDemoFetch() : undefined,
      }),
    [config.baseUrl, config.mode, config.demo],
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
          mergeTrackingState(
            previous,
            snapshot,
            {staleAfterMs: 20_000, maxTrailPoints: 24},
            receiverFromPayload(receiverPayload),
          ),
        );
        setError(undefined);
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : 'Failed to read PiAware feed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void poll();
    const timerId = setInterval(() => {
      void poll();
    }, config.pollMs);

    return () => {
      cancelled = true;
      clearInterval(timerId);
    };
  }, [client, config.pollMs]);

  const allAircraft = useMemo(() => trackingState?.aircraft ?? [], [trackingState?.aircraft]);
  const aircraft = useMemo(() => filterAndSortAircraft(allAircraft, filters), [allAircraft, filters]);

  return {
    loading,
    error,
    asOfMs: trackingState?.asOfMs,
    receiver: trackingState?.receiver,
    allAircraft,
    aircraft,
  };
}
