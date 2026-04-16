export type Direction = "up" | "down" | "left" | "right";

export interface FocusState {
  column: "map" | "details" | "list";
  listIndex: number;
  maxListIndex: number;
}

export function nextFocus(current: FocusState, direction: Direction): FocusState {
  if (current.column === "list") {
    if (direction === "up") {
      return {
        ...current,
        listIndex: Math.max(0, current.listIndex - 1),
      };
    }

    if (direction === "down") {
      return {
        ...current,
        listIndex: Math.min(current.maxListIndex, current.listIndex + 1),
      };
    }
  }

  if (direction === "left") {
    if (current.column === "details") {
      return { ...current, column: "map" };
    }
    if (current.column === "list") {
      return { ...current, column: "details" };
    }
  }

  if (direction === "right") {
    if (current.column === "map") {
      return { ...current, column: "details" };
    }
    if (current.column === "details") {
      return { ...current, column: "list" };
    }
  }

  return current;
}
