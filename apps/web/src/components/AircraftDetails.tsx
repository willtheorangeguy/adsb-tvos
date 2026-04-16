import { formatAltitude, formatDistance, formatSpeed, formatTrack } from "@adsb/shared";
import type { TrackedAircraft } from "@adsb/shared";

interface AircraftDetailsProps {
  aircraft?: TrackedAircraft;
}

function detailRow(label: string, value: string | number | undefined) {
  return (
    <tr>
      <th>{label}</th>
      <td>{value ?? "--"}</td>
    </tr>
  );
}

export function AircraftDetails({ aircraft }: AircraftDetailsProps) {
  return (
    <div className="panel">
      <h2>Selected aircraft</h2>
      {aircraft ? (
        <table className="detail-table">
          <tbody>
            {detailRow("Callsign", aircraft.callsign)}
            {detailRow("ICAO Hex", aircraft.hex)}
            {detailRow("Squawk", aircraft.squawk)}
            {detailRow("Registration", aircraft.registration)}
            {detailRow("Category", aircraft.category)}
            {detailRow("Altitude", formatAltitude(aircraft))}
            {detailRow("Ground speed", formatSpeed(aircraft))}
            {detailRow("Track", formatTrack(aircraft))}
            {detailRow("Distance", formatDistance(aircraft))}
            {detailRow("Age", `${aircraft.ageSeconds.toFixed(1)} sec`)}
            {detailRow("RSSI", aircraft.rssi?.toFixed(1))}
            {detailRow("Messages", aircraft.messages)}
          </tbody>
        </table>
      ) : (
        <p className="empty">Select an aircraft on the map or table.</p>
      )}
    </div>
  );
}
