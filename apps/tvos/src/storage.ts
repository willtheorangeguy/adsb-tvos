import {Settings} from 'react-native';
export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = Settings.get(key);
    return typeof raw === 'string' ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown): void {
  Settings.set({[key]: JSON.stringify(value)});
}
