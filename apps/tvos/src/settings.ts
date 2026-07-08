import {Settings} from 'react-native';

import {defaultConfig, type AppConfig} from './config';

// Persist configuration to NSUserDefaults via React Native's built-in Settings
// module (iOS/tvOS). This is part of RN core, so it needs no extra native
// dependency. "First launch after install" is simply the absence of the
// `configured` flag.

const KEYS = {
  configured: 'adsb.configured',
  mode: 'adsb.mode',
  baseUrl: 'adsb.baseUrl',
  pollMs: 'adsb.pollMs',
  demo: 'adsb.demo',
} as const;

const canPersist = !!Settings && typeof Settings.get === 'function';

// NSUserDefaults booleans come back as 1/0 (or sometimes true/false).
function toBool(value: unknown): boolean {
  return value === true || value === 1;
}

export interface LoadedSettings {
  config: AppConfig;
  configured: boolean;
}

export function loadSettings(): LoadedSettings {
  if (!canPersist) {
    return {config: defaultConfig, configured: false};
  }

  const mode = Settings.get(KEYS.mode);
  const baseUrl = Settings.get(KEYS.baseUrl);
  const pollMs = Settings.get(KEYS.pollMs);
  const rawDemo = Settings.get(KEYS.demo);

  return {
    // NSUserDefaults stores booleans as NSNumber, so RN surfaces them as 1/0,
    // not JS true/false — coerce rather than compare strictly.
    configured: toBool(Settings.get(KEYS.configured)) === true,
    config: {
      mode: mode === 'proxy' || mode === 'direct' ? mode : defaultConfig.mode,
      baseUrl: typeof baseUrl === 'string' && baseUrl ? baseUrl : defaultConfig.baseUrl,
      pollMs: typeof pollMs === 'number' && pollMs >= 1_000 ? pollMs : defaultConfig.pollMs,
      demo: rawDemo === undefined || rawDemo === null ? defaultConfig.demo : toBool(rawDemo),
    },
  };
}

export function saveSettings(config: AppConfig): void {
  if (!canPersist) {
    return;
  }

  Settings.set({
    [KEYS.mode]: config.mode,
    [KEYS.baseUrl]: config.baseUrl,
    [KEYS.pollMs]: config.pollMs,
    [KEYS.demo]: config.demo,
    [KEYS.configured]: true,
  });
}
