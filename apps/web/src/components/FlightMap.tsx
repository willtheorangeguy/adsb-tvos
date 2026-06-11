import { Fragment, useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

import { approximateLocationFromAircraft, type LatLon, type TrackedAircraft } from "@adsb/shared";

const US_GEOGRAPHIC_CENTER = [39.8283, -98.5795] as [number, number];

interface FlightMapProps {
  aircraft: TrackedAircraft[];
  selectedHex?: string;
  receiver?: { lat: number; lon: number };
  onSelectAircraft: (hex: string) => void;
}

function headingEndpoint(
  position: { lat: number; lon: number },
  headingDeg: number,
): { lat: number; lon: number } {
  const distanceNm = 4;
  const distanceKm = distanceNm * 1.852;
  const headingRad = (headingDeg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latRad = (position.lat * Math.PI) / 180;
  const lonRad = (position.lon * Math.PI) / 180;

  const targetLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceKm / earthRadiusKm) +
      Math.cos(latRad) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(headingRad),
  );

  const targetLonRad =
    lonRad +
    Math.atan2(
      Math.sin(headingRad) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(latRad),
      Math.cos(distanceKm / earthRadiusKm) - Math.sin(latRad) * Math.sin(targetLatRad),
    );

  return {
    lat: (targetLatRad * 180) / Math.PI,
    lon: (targetLonRad * 180) / Math.PI,
  };
}

/**
 * Re-centers the live map on the receiver's approximate location once it becomes
 * known. MapContainer only honors its `center` prop on the initial mount, so the
 * map starts on the US fallback before any feed data arrives and must be moved
 * imperatively afterward. Runs once so it never fights the user panning the map.
 */
function HomeView({ home }: { home?: LatLon }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (hasCentered.current || !home) {
      return;
    }

    map.setView([home.lat, home.lon], map.getZoom());
    hasCentered.current = true;
  }, [home, map]);

  return null;
}

export function FlightMap({ aircraft, selectedHex, receiver, onSelectAircraft }: FlightMapProps) {
  // The receiver report is the most precise home location; otherwise derive an
  // approximate location from where the tracked aircraft are clustered.
  const home = useMemo<LatLon | undefined>(
    () => receiver ?? approximateLocationFromAircraft(aircraft),
    [aircraft, receiver],
  );

  return (
    <MapContainer center={US_GEOGRAPHIC_CENTER} zoom={8} minZoom={3} maxZoom={14} scrollWheelZoom className="flight-map">
      <HomeView home={home} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {receiver ? (
        <CircleMarker center={[receiver.lat, receiver.lon]} radius={6} pathOptions={{ color: "#18c964" }}>
          <Tooltip>Receiver</Tooltip>
        </CircleMarker>
      ) : null}

      {aircraft
        .filter((plane) => plane.position)
        .map((plane) => {
          const selected = plane.hex === selectedHex;
          const position = plane.position!;
          const headingPoint =
            typeof plane.trackDeg === "number" ? headingEndpoint(position, plane.trackDeg) : undefined;

          return (
            <Fragment key={plane.hex}>
              <CircleMarker
                center={[position.lat, position.lon]}
                radius={selected ? 8 : 5}
                eventHandlers={{
                  click: () => {
                    onSelectAircraft(plane.hex);
                  },
                }}
                pathOptions={{
                  color: selected ? "#f59e0b" : plane.stale ? "#94a3b8" : "#2563eb",
                  fillOpacity: 0.8,
                }}
              >
                <Tooltip>
                  {(plane.callsign ?? plane.hex).trim()} {plane.altitudeFt ? `• ${Math.round(plane.altitudeFt)} ft` : ""}
                </Tooltip>
              </CircleMarker>

              {plane.trail.length >= 2 ? (
                <Polyline
                  positions={plane.trail.map((point) => [point.lat, point.lon] as [number, number])}
                  pathOptions={{
                    color: selected ? "#f59e0b" : "#64748b",
                    opacity: selected ? 0.7 : 0.35,
                    weight: selected ? 3 : 2,
                  }}
                />
              ) : null}

              {headingPoint ? (
                <Polyline
                  positions={[
                    [position.lat, position.lon],
                    [headingPoint.lat, headingPoint.lon],
                  ]}
                  pathOptions={{
                    color: selected ? "#f59e0b" : "#2563eb",
                    opacity: 0.8,
                    weight: 2,
                  }}
                />
              ) : null}
            </Fragment>
          );
        })}
    </MapContainer>
  );
}
