import { ReceiverDatabase } from "./receiverDatabase.js";
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
  dispose: () => void;
  getReceiver: () => Promise<PiAwareReceiverResponse | undefined>;
  getHistory: () => Promise<unknown | undefined>;
}

export function createPiAwareClient(
  config: PiAwareClientConfig
): PiAwareClient {
  const fetchImpl = config.fetchImpl ?? fetch;
  const base = config.baseUrl.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base))
    throw new Error("Enter a receiver URL starting with http:// or https://");
  let discovered: string | undefined;
  let database: ReceiverDatabase | undefined;
  const prefixes = [
    "/skyaware/data",
    "/data",
    "/tar1090/data",
    "/dump1090-fa/data",
    "/dump1090/data",
  ];
  async function read(
    type: "aircraft" | "receiver" | "history_0",
    optional = false
  ): Promise<unknown> {
    const paths =
      config.mode === "proxy"
        ? [`/api/${type === "history_0" ? "history" : type}`]
        : discovered
        ? [`${discovered}/${type}.json`]
        : prefixes.map((prefix) => `${prefix}/${type}.json`);
    for (const path of paths) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetchImpl(`${base}${path}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (response.status === 404) continue;
        if (!response.ok)
          throw new Error(`Receiver returned HTTP ${response.status}`);
        const payload: unknown = await response.json();
        if (type === "aircraft") {
          if (
            !payload ||
            typeof payload !== "object" ||
            !Array.isArray((payload as PiAwareAircraftResponse).aircraft)
          )
            continue;
          if (config.mode !== "proxy")
            discovered = path.slice(0, path.lastIndexOf("/"));
        }
        return payload;
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
    if (optional) return undefined;
    throw new Error(
      "No aircraft.json found. Check your receiver address and that SkyAware or tar1090 is running."
    );
  }
  return {
    dispose() {
      database?.dispose();
    },
    async getAircraftSnapshot() {
      const payload = (await read("aircraft")) as PiAwareAircraftResponse;
      if (discovered && !database)
        database = new ReceiverDatabase(
          `${base}${discovered.replace(/\/data$/, "")}/db`,
          fetchImpl
        );
      return {
        sourceTimestampMs: payload.now ? payload.now * 1000 : Date.now(),
        aircraft: database
          ? database.enrich(payload.aircraft)
          : payload.aircraft,
      };
    },
    async getReceiver() {
      return (await read("receiver", true)) as
        | PiAwareReceiverResponse
        | undefined;
    },
    async getHistory() {
      return read("history_0", true);
    },
  };
}
