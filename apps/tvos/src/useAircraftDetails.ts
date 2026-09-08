import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {
  AIRCRAFT_API_USER_AGENT,
  createAircraftDetailsClient,
  type AircraftDetailsResult,
} from '@adsb/shared';

export function useAircraftDetails(hex: string | undefined, enabled: boolean) {
  const [entry, setEntry] = useState<{
    hex: string;
    client: ReturnType<typeof createAircraftDetailsClient>;
    result: AircraftDetailsResult;
  }>();
  const [client, setClient] =
    useState<ReturnType<typeof createAircraftDetailsClient>>();
  useEffect(() => {
    if (!enabled) return;
    const next = createAircraftDetailsClient({
      userAgent: Platform.OS === 'web' ? undefined : AIRCRAFT_API_USER_AGENT,
    });
    setClient(next);
    return () => next.dispose();
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !hex || !client) return;
    let active = true;
    const lookup = () =>
      client.lookup(hex).then(result => {
        if (active) setEntry({hex, client, result});
      });
    const timer = setTimeout(lookup, 350);
    const refresh = setInterval(lookup, 60000);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(refresh);
    };
  }, [hex, enabled, client]);
  return enabled && hex && entry?.hex === hex && entry.client === client
    ? entry.result
    : undefined;
}
