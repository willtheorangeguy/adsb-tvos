import type { AircraftFilters, TrackedAircraft } from "./types.js";

function compareByString(left: string | undefined, right: string | undefined): number {
  return (left ?? "").localeCompare(right ?? "");
}

export function filterAndSortAircraft(
  aircraft: TrackedAircraft[],
  filters: AircraftFilters,
): TrackedAircraft[] {
  const query = filters.searchText?.trim().toUpperCase();

  const filtered = aircraft.filter((plane) => {
    if (filters.requirePosition && !plane.position) {
      return false;
    }

    if (
      typeof filters.minAltitudeFt === "number" &&
      typeof plane.altitudeFt === "number" &&
      plane.altitudeFt < filters.minAltitudeFt
    ) {
      return false;
    }

    if (
      typeof filters.maxAltitudeFt === "number" &&
      typeof plane.altitudeFt === "number" &&
      plane.altitudeFt > filters.maxAltitudeFt
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [plane.hex, plane.callsign, plane.registration, plane.squawk]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toUpperCase().includes(query));
  });

  const sortDirection = filters.sortDirection ?? "asc";
  const multiplier = sortDirection === "asc" ? 1 : -1;
  const sortBy = filters.sortBy ?? "distance";

  return filtered.sort((left, right) => {
    if (sortBy === "distance") {
      return ((left.distanceNm ?? Number.POSITIVE_INFINITY) - (right.distanceNm ?? Number.POSITIVE_INFINITY)) * multiplier;
    }

    if (sortBy === "altitude") {
      return ((left.altitudeFt ?? Number.NEGATIVE_INFINITY) - (right.altitudeFt ?? Number.NEGATIVE_INFINITY)) * multiplier;
    }

    if (sortBy === "speed") {
      return ((left.groundSpeedKt ?? Number.NEGATIVE_INFINITY) - (right.groundSpeedKt ?? Number.NEGATIVE_INFINITY)) * multiplier;
    }

    if (sortBy === "seen") {
      return (left.ageSeconds - right.ageSeconds) * multiplier;
    }

    return compareByString(left.callsign, right.callsign) * multiplier;
  });
}
