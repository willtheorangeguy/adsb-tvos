// Minimal Web Mercator helpers for laying out OpenStreetMap raster tiles and
// projecting aircraft positions onto them. Pixel coordinates are "world pixels"
// (tile coordinate * 256) at a given integer zoom, matching the slippy-map
// tiling scheme used by OSM.

export const TILE_SIZE = 256;

const EARTH_CIRCUMFERENCE_MPP = 156543.03392804097; // meters/pixel at zoom 0, equator
const METERS_PER_NM = 1852;

export interface WorldPixel {
  x: number;
  y: number;
}

export function lonToWorldX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom) * TILE_SIZE;
}

export function latToWorldY(lat: number, zoom: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  return y * Math.pow(2, zoom) * TILE_SIZE;
}

export function project(lat: number, lon: number, zoom: number): WorldPixel {
  return {x: lonToWorldX(lon, zoom), y: latToWorldY(lat, zoom)};
}

export function metersPerPixel(lat: number, zoom: number): number {
  return (EARTH_CIRCUMFERENCE_MPP * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

// Choose the integer zoom whose scale places `halfRangeNm` closest to `halfPx`
// pixels from the center, so the requested range roughly fills the square.
export function pickZoom(lat: number, halfPx: number, halfRangeNm: number): number {
  const targetMpp = (halfRangeNm * METERS_PER_NM) / Math.max(1, halfPx);
  const zoom = Math.log2((EARTH_CIRCUMFERENCE_MPP * Math.cos((lat * Math.PI) / 180)) / targetMpp);
  return Math.max(2, Math.min(16, Math.floor(zoom)));
}

export function nmToPixels(nm: number, lat: number, zoom: number): number {
  return (nm * METERS_PER_NM) / metersPerPixel(lat, zoom);
}
