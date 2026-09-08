import {defaultConfig, type AppConfig} from './config';
import {readStored, writeStored} from './storage';
export function loadSettings(): {config: AppConfig; configured: boolean} {
  const saved = readStored<Partial<AppConfig> | null>('adsb.settings.v2', null);
  return {config: {...defaultConfig, ...saved}, configured: !!saved};
}
export function saveSettings(config: AppConfig): void {
  writeStored('adsb.settings.v2', config);
}
