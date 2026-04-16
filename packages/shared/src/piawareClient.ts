import type {
  AircraftSnapshot,
  PiAwareAircraftResponse,
  PiAwareReceiverResponse,
} from "./types.js";

export type PiAwareMode = "direct" | "proxy";

export interface PiAwareClientConfig {
  baseUrl: string;
  mode?: PiAwareMode;
  fetchImpl?: typeof fetch;
}

export interface PiAwareClient {
  getAircraftSnapshot: () => Promise<AircraftSnapshot>;
  getReceiver: () => Promise<PiAwareReceiverResponse | undefined>;
  getHistory: () => Promise<unknown | undefined>;
}

function endpointFor(mode: PiAwareMode, type: "aircraft" | "receiver" | "history"): string {
  if (mode === "proxy") {
    return `/api/${type}`;
  }

  if (type === "aircraft") {
    return "/skyaware/data/aircraft.json";
  }

  if (type === "receiver") {
    return "/skyaware/data/receiver.json";
  }

  return "/skyaware/data/history_0.json";
}

function toUrl(baseUrl: string, endpoint: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${endpoint}`;
}

async function fetchJson<T>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  endpoint: string,
): Promise<T> {
  const response = await fetchImpl(toUrl(baseUrl, endpoint), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`PiAware request failed (${response.status}) at ${endpoint}`);
  }

  return (await response.json()) as T;
}

async function fetchJsonOptional<T>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  endpoint: string,
): Promise<T | undefined> {
  const response = await fetchImpl(toUrl(baseUrl, endpoint), {
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`PiAware request failed (${response.status}) at ${endpoint}`);
  }

  return (await response.json()) as T;
}

export function createPiAwareClient(config: PiAwareClientConfig): PiAwareClient {
  const mode = config.mode ?? "direct";
  const fetchImpl = config.fetchImpl ?? fetch;

  if (!config.baseUrl) {
    throw new Error("PiAware baseUrl is required");
  }

  return {
    async getAircraftSnapshot() {
      const payload = await fetchJson<PiAwareAircraftResponse>(
        fetchImpl,
        config.baseUrl,
        endpointFor(mode, "aircraft"),
      );

      const sourceTimestampMs = payload.now ? payload.now * 1000 : Date.now();
      return {
        sourceTimestampMs,
        aircraft: payload.aircraft ?? [],
      };
    },
    async getReceiver() {
      return fetchJsonOptional<PiAwareReceiverResponse>(
        fetchImpl,
        config.baseUrl,
        endpointFor(mode, "receiver"),
      );
    },
    async getHistory() {
      return fetchJsonOptional<unknown>(fetchImpl, config.baseUrl, endpointFor(mode, "history"));
    },
  };
}
