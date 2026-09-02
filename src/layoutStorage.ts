import type { XYPosition } from "@xyflow/react";
import { DEFAULT_SELECTED_ID, powerNodes, type PowerNode } from "./data/scenario";

const LAYOUT_STORAGE_KEY = "neuron-field-notes:node-layout:v2";

export const initialPositions: Record<string, XYPosition> = Object.fromEntries(
  powerNodes.map((node) => [node.id, node.position]),
);

function readStoredPositions(): Record<string, XYPosition> {
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const positions: Record<string, XYPosition> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const point = value as { x?: unknown; y?: unknown } | null;
      if (point && typeof point.x === "number" && typeof point.y === "number") {
        if (Number.isFinite(point.x) && Number.isFinite(point.y)) positions[id] = { x: point.x, y: point.y };
      }
    }
    return positions;
  } catch {
    return {};
  }
}

export function savePositions(nodes: PowerNode[]) {
  try {
    const positions = Object.fromEntries(nodes.map((node) => [node.id, node.position]));
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Layout persistence is a convenience. Ignore quota and private-mode failures.
  }
}

/** Default layout with any positions the viewer dragged into place on an earlier visit. */
export function buildInitialNodes(): PowerNode[] {
  const stored = readStoredPositions();
  return powerNodes.map((node) => ({
    ...node,
    position: stored[node.id] ?? { ...node.position },
    selected: node.id === DEFAULT_SELECTED_ID,
  }));
}
