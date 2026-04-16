import { useEffect, useMemo, useState } from "react";

import type { AircraftFilters, SortField } from "@adsb/shared";

import { AircraftDetails } from "./components/AircraftDetails";
import { AircraftTable } from "./components/AircraftTable";
import { FlightMap } from "./components/FlightMap";
import { readConfig } from "./config";
import { useAdsbFeed } from "./hooks/useAdsbFeed";
import "./App.css";

const config = readConfig();

function App() {
  const [selectedHex, setSelectedHex] = useState<string>();
  const [searchText, setSearchText] = useState("");
  const [requirePosition, setRequirePosition] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>("distance");

  const filters = useMemo<AircraftFilters>(
    () => ({
      searchText,
      requirePosition,
      sortBy,
      sortDirection: "asc",
    }),
    [requirePosition, searchText, sortBy],
  );

  const feed = useAdsbFeed(config, filters);

  const effectiveSelectedHex = useMemo(() => {
    if (!feed.aircraft.length) {
      return undefined;
    }

    if (!selectedHex || !feed.aircraft.some((plane) => plane.hex === selectedHex)) {
      return feed.aircraft[0]?.hex;
    }

    return selectedHex;
  }, [feed.aircraft, selectedHex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!feed.aircraft.length || !effectiveSelectedHex) {
        return;
      }

      const index = feed.aircraft.findIndex((plane) => plane.hex === effectiveSelectedHex);
      if (index < 0) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        const next = feed.aircraft[Math.min(index + 1, feed.aircraft.length - 1)];
        if (next) {
          setSelectedHex(next.hex);
          event.preventDefault();
        }
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        const previous = feed.aircraft[Math.max(index - 1, 0)];
        if (previous) {
          setSelectedHex(previous.hex);
          event.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [effectiveSelectedHex, feed.aircraft]);

  const selected = feed.aircraft.find((plane) => plane.hex === effectiveSelectedHex);
  const asOf = feed.asOfMs ? new Date(feed.asOfMs).toLocaleTimeString() : "--";

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>ADS-B Local Radar</h1>
          <p>
            PiAware source: <code>{config.baseUrl}</code> ({config.mode})
          </p>
          <p className="subtle">Remote controls: arrow keys move selection.</p>
        </div>
        <div className="status">
          <div>Visible: {feed.aircraft.length}</div>
          <div>Total: {feed.allAircraft.length}</div>
          <div>Updated: {asOf}</div>
          <div>Poll: {config.pollMs}ms</div>
        </div>
      </header>

      <section className="controls">
        <label>
          Search
          <input
            value={searchText}
            placeholder="Callsign, hex, registration, squawk"
            onChange={(event) => {
              setSearchText(event.target.value);
            }}
          />
        </label>

        <label>
          Sort
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as SortField);
            }}
          >
            <option value="distance">Distance</option>
            <option value="altitude">Altitude</option>
            <option value="speed">Speed</option>
            <option value="seen">Recent</option>
            <option value="callsign">Callsign</option>
          </select>
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={requirePosition}
            onChange={(event) => {
              setRequirePosition(event.target.checked);
            }}
          />
          Position only
        </label>
      </section>

      {feed.error ? <p className="error">{feed.error}</p> : null}
      {feed.loading && feed.allAircraft.length === 0 ? <p className="loading">Loading feed...</p> : null}

      <main className="layout">
        <div className="map-column">
          <FlightMap
            aircraft={feed.aircraft}
            selectedHex={effectiveSelectedHex}
            receiver={feed.receiver}
            onSelectAircraft={setSelectedHex}
          />
        </div>

        <div className="side-column">
          <AircraftDetails aircraft={selected} />
          <AircraftTable
            aircraft={feed.aircraft}
            selectedHex={effectiveSelectedHex}
            onSelectAircraft={setSelectedHex}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
