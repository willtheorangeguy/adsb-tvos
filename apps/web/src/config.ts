export interface AppConfig {
  mode: "direct" | "proxy";
  baseUrl: string;
  pollMs: number;
}

export function readConfig(): AppConfig {
  const mode = import.meta.env.VITE_PIAWARE_MODE === "direct" ? "direct" : "proxy";
  const baseUrl =
    import.meta.env.VITE_PIAWARE_BASE_URL ??
    (mode === "proxy" ? "http://localhost:7070" : "http://piaware.local");
  const pollMs = Number(import.meta.env.VITE_POLL_MS ?? 2_000);

  return {
    mode,
    baseUrl,
    pollMs: Number.isFinite(pollMs) && pollMs >= 1_000 ? pollMs : 2_000,
  };
}
