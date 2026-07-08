import type {PiAwareMode} from '@adsb/shared';

export interface AppConfig {
  mode: PiAwareMode;
  baseUrl: string;
  pollMs: number;
  // When true, the app synthesizes moving aircraft instead of contacting a real
  // PiAware feeder. This lets the tvOS app run in the simulator (which has no
  // access to a local feeder) with a populated, animated UI.
  demo: boolean;
}

// Defaults used the first time the app runs, before the user saves settings.
// On tvOS the app talks to the feeder directly (no browser CORS to work around),
// so "direct" mode is the sensible default. See apps/proxy/README.md for the
// proxy setup if you route through it instead.
export const defaultConfig: AppConfig = {
  mode: 'direct',
  baseUrl: 'http://piaware.local',
  pollMs: 2_000,
  demo: true,
};

export const POLL_OPTIONS_MS = [1_000, 2_000, 5_000];
