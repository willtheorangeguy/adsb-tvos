export type SortField = "distance" | "altitude" | "speed" | "seen" | "callsign";
export type SortDirection = "asc" | "desc";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface PiAwareAircraftRecord {
  hex: string;
  flight?: string;
  squawk?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  gs?: number;
  track?: number;
  baro_rate?: number;
  rssi?: number;
  seen?: number;
  messages?: number;
  category?: string;
  reg?: string;
  nav_heading?: number;
  nav_qnh?: number;
  nav_altitude_mcp?: number;
  nav_altitude_fms?: number;
}

export interface PiAwareAircraftResponse {
  now?: number;
  messages?: number;
  aircraft: PiAwareAircraftRecord[];
}

export interface PiAwareReceiverResponse {
  lat?: number;
  lon?: number;
  version?: string;
  refresh?: number;
  history?: number;
  [key: string]: unknown;
}

export interface AircraftSnapshot {
  sourceTimestampMs: number;
  aircraft: PiAwareAircraftRecord[];
}

export interface AircraftTrackPoint extends LatLon {
  timestampMs: number;
}

export interface TrackedAircraft {
  hex: string;
  callsign?: string;
  squawk?: string;
  registration?: string;
  category?: string;
  position?: LatLon;
  altitudeFt?: number;
  groundSpeedKt?: number;
  trackDeg?: number;
  verticalRateFpm?: number;
  navHeadingDeg?: number;
  rssi?: number;
  messages?: number;
  ageSeconds: number;
  lastSeenMs: number;
  stale: boolean;
  distanceNm?: number;
  trail: AircraftTrackPoint[];
}

export interface TrackingState {
  asOfMs: number;
  receiver?: LatLon;
  aircraft: TrackedAircraft[];
}

export interface TrackerOptions {
  staleAfterMs?: number;
  maxTrailPoints?: number;
}

export interface AircraftFilters {
  searchText?: string;
  minAltitudeFt?: number;
  maxAltitudeFt?: number;
  requirePosition?: boolean;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}
