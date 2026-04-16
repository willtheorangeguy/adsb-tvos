import { formatAltitude, formatDistance, formatSpeed } from "@adsb/shared";
import type { TrackedAircraft } from "@adsb/shared";

interface AircraftTableProps {
  aircraft: TrackedAircraft[];
  selectedHex?: string;
  onSelectAircraft: (hex: string) => void;
}

export function AircraftTable({ aircraft, selectedHex, onSelectAircraft }: AircraftTableProps) {
  return (
    <div className="panel">
      <h2>Aircraft ({aircraft.length})</h2>
      <div className="aircraft-table-wrap">
        <table className="aircraft-table">
          <thead>
            <tr>
              <th>Callsign / Hex</th>
              <th>Altitude</th>
              <th>Speed</th>
              <th>Range</th>
            </tr>
          </thead>
          <tbody>
            {aircraft.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  No aircraft match current filters.
                </td>
              </tr>
            ) : (
              aircraft.slice(0, 300).map((plane) => (
                <tr
                  key={plane.hex}
                  className={plane.hex === selectedHex ? "selected" : undefined}
                  onClick={() => {
                    onSelectAircraft(plane.hex);
                  }}
                >
                  <td>
                    <div className="callsign">{plane.callsign || "--"}</div>
                    <div className="subtle">{plane.hex}</div>
                  </td>
                  <td>{formatAltitude(plane)}</td>
                  <td>{formatSpeed(plane)}</td>
                  <td>{formatDistance(plane)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
