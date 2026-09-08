export function readStored<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
