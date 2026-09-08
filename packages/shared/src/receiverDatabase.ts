import type { PiAwareAircraftRecord } from "./types.js";
interface Metadata {
  r?: string;
  t?: string;
  description?: string;
}
type Block = Record<string, unknown>;

// SkyAware's optional, receiver-hosted database is sharded by ICAO prefix.
// Lookups run behind the live feed; a missing database never delays a poll.
export class ReceiverDatabase {
  private blocks = new Map<string, Promise<Block | undefined>>();
  private results = new Map<string, Metadata>();
  private requested = new Set<string>();
  private queue: string[] = [];
  private active = 0;
  private stopped = false;
  private controllers = new Set<AbortController>();
  private baseUrl: string;
  private fetchImpl: typeof fetch;
  constructor(baseUrl: string, fetchImpl: typeof fetch) {
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
  }

  enrich(records: PiAwareAircraftRecord[]): PiAwareAircraftRecord[] {
    const result = records.map((record) => {
      const hex = record.hex.trim().toUpperCase();
      if (
        /^[A-F0-9]{6}$/.test(hex) &&
        (!record.t || !(record.r || record.reg)) &&
        !this.requested.has(hex) &&
        this.queue.length < 200
      ) {
        if (this.requested.size >= 2048)
          this.requested.delete(this.requested.values().next().value!);
        this.requested.add(hex);
        this.queue.push(hex);
      }
      const data = this.results.get(hex);
      return data
        ? {
            ...record,
            reg: record.reg || record.r || data.r,
            t: record.t || data.t,
            description: record.description || data.description,
          }
        : record;
    });
    this.drain();
    return result;
  }
  dispose(): void {
    this.stopped = true;
    this.queue = [];
    this.controllers.forEach((c) => c.abort());
  }
  private drain(): void {
    while (!this.stopped && this.active < 2 && this.queue.length) {
      const hex = this.queue.shift()!;
      this.active++;
      void this.lookup(hex)
        .then((data) => {
          if (!data || this.stopped) return;
          if (this.results.size >= 2048)
            this.results.delete(this.results.keys().next().value!);
          this.results.set(hex, data);
        })
        .catch(() => {})
        .finally(() => {
          this.active--;
          this.drain();
        });
    }
  }
  private block(prefix: string): Promise<Block | undefined> {
    const cached = this.blocks.get(prefix);
    if (cached) return cached;
    const controller = new AbortController();
    this.controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 3000);
    const promise = this.fetchImpl(`${this.baseUrl}/${prefix}.json`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return undefined;
        const data: unknown = await response.json();
        return data && typeof data === "object" && !Array.isArray(data)
          ? (data as Block)
          : undefined;
      })
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(timer);
        this.controllers.delete(controller);
      });
    if (this.blocks.size >= 64)
      this.blocks.delete(this.blocks.keys().next().value!);
    this.blocks.set(prefix, promise);
    return promise;
  }
  private async lookup(hex: string): Promise<Metadata | undefined> {
    for (let level = 1; level <= 6 && !this.stopped; level++) {
      const data = await this.block(hex.slice(0, level));
      if (!data) return undefined;
      const entry = data[hex.slice(level)];
      if (entry && typeof entry === "object") {
        const fields = entry as Record<string, unknown>;
        return {
          r: typeof fields.r === "string" ? fields.r : undefined,
          t: typeof fields.t === "string" ? fields.t : undefined,
          description:
            typeof fields.description === "string"
              ? fields.description
              : undefined,
        };
      }
      if (
        !Array.isArray(data.children) ||
        !data.children.includes(hex.slice(0, level + 1))
      )
        return undefined;
    }
    return undefined;
  }
}
