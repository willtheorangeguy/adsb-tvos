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
export function useAdsbFeed(
  config: AppConfig,
  filters: AircraftFilters,
): FeedState {
  const [state, setState] = useState<{
    tracking?: TrackingState;
    error?: string;
    loading: boolean;
  }>({loading: true});
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let previous: TrackingState | undefined;
    let receiver: LatLon | undefined;
    setState({loading: true});
    const client = createPiAwareClient({
      mode: config.mode,
      baseUrl: config.baseUrl,
      fetchImpl: config.demo ? createDemoFetch() : undefined,
    });
    const poll = async () => {
      try {
        const snapshot = await client.getAircraftSnapshot();
        if (!receiver) {
          try {
            receiver = receiverFromPayload(await client.getReceiver());
          } catch {
            /* Receiver metadata must not block aircraft. */
          }
          if (
            !receiver &&
            Number.isFinite(config.latitude) &&
            Number.isFinite(config.longitude)
          )
            receiver = {lat: config.latitude!, lon: config.longitude!};
        }
        if (cancelled) return;
        previous = mergeTrackingState(
          previous,
          snapshot,
          {staleAfterMs: 20000, maxTrailPoints: 90},
          receiver,
        );
        const delayed = Date.now() - snapshot.sourceTimestampMs > 20000;
        if (delayed)
          previous = {
            ...previous,
            aircraft: previous.aircraft.map(p => ({...p, stale: true})),
          };
        setState({
          tracking: previous,
          loading: false,
          error: delayed
            ? 'Receiver data is more than 20 seconds old'
            : undefined,
        });
      } catch (error) {
        if (!cancelled)
          setState({
            tracking: previous
              ? {
                  ...previous,
                  aircraft: previous.aircraft.map(p => ({...p, stale: true})),
                }
              : undefined,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Could not reach your receiver',
          });
      } finally {
        if (!cancelled) timer = setTimeout(poll, config.pollMs);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      client.dispose();
      clearTimeout(timer);
    };
  }, [
    config.baseUrl,
    config.mode,
    config.demo,
    config.pollMs,
    config.latitude,
    config.longitude,
  ]);
  const allAircraft = useMemo(
    () => state.tracking?.aircraft ?? [],
    [state.tracking],
  );
  const aircraft = useMemo(
    () => filterAndSortAircraft(allAircraft, filters),
    [allAircraft, filters],
  );
  return {
    loading: state.loading,
    error: state.error,
    asOfMs: state.tracking?.asOfMs,
    receiver: state.tracking?.receiver,
    allAircraft,
    aircraft,
  };
}
