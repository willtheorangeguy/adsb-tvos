import { describe, expect, it } from "vitest";

import { nextFocus } from "./focusNavigation.js";
import type { FocusState } from "./focusNavigation.js";

const baseState: FocusState = {
  column: "map",
  listIndex: 0,
  maxListIndex: 5,
};

describe("nextFocus", () => {
  describe("list column vertical navigation", () => {
    it("moves down in the list when direction is down", () => {
      const state: FocusState = { ...baseState, column: "list", listIndex: 2 };
      const next = nextFocus(state, "down");
      expect(next.listIndex).toBe(3);
    });

    it("does not exceed maxListIndex when moving down", () => {
      const state: FocusState = { ...baseState, column: "list", listIndex: 5 };
      const next = nextFocus(state, "down");
      expect(next.listIndex).toBe(5);
    });

    it("moves up in the list when direction is up", () => {
      const state: FocusState = { ...baseState, column: "list", listIndex: 3 };
      const next = nextFocus(state, "up");
      expect(next.listIndex).toBe(2);
    });

    it("does not go below 0 when moving up", () => {
      const state: FocusState = { ...baseState, column: "list", listIndex: 0 };
      const next = nextFocus(state, "up");
      expect(next.listIndex).toBe(0);
    });

    it("keeps column as list when navigating vertically", () => {
      const state: FocusState = { ...baseState, column: "list", listIndex: 1 };
      expect(nextFocus(state, "up").column).toBe("list");
      expect(nextFocus(state, "down").column).toBe("list");
    });
  });

  describe("horizontal navigation", () => {
    it("moves from map to details when direction is right", () => {
      const state: FocusState = { ...baseState, column: "map" };
      const next = nextFocus(state, "right");
      expect(next.column).toBe("details");
    });

    it("moves from details to list when direction is right", () => {
      const state: FocusState = { ...baseState, column: "details" };
      const next = nextFocus(state, "right");
      expect(next.column).toBe("list");
    });

    it("does not move right from the list column", () => {
      const state: FocusState = { ...baseState, column: "list" };
      const next = nextFocus(state, "right");
      expect(next.column).toBe("list");
    });

    it("moves from details to map when direction is left", () => {
      const state: FocusState = { ...baseState, column: "details" };
      const next = nextFocus(state, "left");
      expect(next.column).toBe("map");
    });

    it("moves from list to details when direction is left", () => {
      const state: FocusState = { ...baseState, column: "list" };
      const next = nextFocus(state, "left");
      expect(next.column).toBe("details");
    });

    it("does not move left from the map column", () => {
      const state: FocusState = { ...baseState, column: "map" };
      const next = nextFocus(state, "left");
      expect(next.column).toBe("map");
    });
  });

  describe("state preservation", () => {
    it("preserves listIndex when changing columns horizontally", () => {
      const state: FocusState = { ...baseState, column: "map", listIndex: 3 };
      const next = nextFocus(state, "right");
      expect(next.listIndex).toBe(3);
    });

    it("preserves maxListIndex across all transitions", () => {
      const state: FocusState = { ...baseState, column: "details", maxListIndex: 9 };
      const next = nextFocus(state, "right");
      expect(next.maxListIndex).toBe(9);
    });

    it("returns the same state reference when no transition applies", () => {
      const state: FocusState = { ...baseState, column: "map" };
      const next = nextFocus(state, "up");
      expect(next).toBe(state);
    });
  });
});
