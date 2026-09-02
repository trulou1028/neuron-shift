import type { XYPosition } from "@xyflow/react";
import { DEFAULT_SELECTED_ID, powerNodes, type PowerNode } from "./data/scenario";
import type { OperatorDecision } from "./data/decisions";
import type { PinnedWidget } from "./data/widgets";

const LAYOUT_STORAGE_KEY = "neuron-field-notes:node-layout:v2";
const WIDGET_STORAGE_KEY = "neuron-shift:widgets:v1";
const DECISION_STORAGE_KEY = "neuron-shift:decisions:v1";

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

/* Pinned widgets and the decisions behind them. Both survive a reload so the canvas
 * an operator arranged is still there when they come back to it. */

function readJson<T>(key: string, isValid: (value: unknown) => boolean): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid) as T[];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is a convenience. Ignore quota and private-mode failures.
  }
}

const knownNode = (id: unknown) => typeof id === "string" && powerNodes.some((node) => node.id === id);

export function readStoredWidgets(): PinnedWidget[] {
  return readJson<PinnedWidget>(WIDGET_STORAGE_KEY, (value) => {
    const widget = value as Partial<PinnedWidget> | null;
    return (
      !!widget &&
      typeof widget.id === "string" &&
      knownNode(widget.node) &&
      (widget.kind === "decision" || widget.kind === "impact" || widget.kind === "handoff") &&
      !!widget.offset &&
      Number.isFinite(widget.offset.x) &&
      Number.isFinite(widget.offset.y)
    );
  });
}

export const saveWidgets = (widgets: PinnedWidget[]) => writeJson(WIDGET_STORAGE_KEY, widgets);

export function readStoredDecisions(): OperatorDecision[] {
  return readJson<OperatorDecision>(DECISION_STORAGE_KEY, (value) => {
    const decision = value as Partial<OperatorDecision> | null;
    return !!decision && typeof decision.recommendationId === "string" && knownNode(decision.node);
  });
}

export const saveDecisions = (decisions: OperatorDecision[]) => writeJson(DECISION_STORAGE_KEY, decisions);

export function clearPinsAndDecisions() {
  try {
    window.localStorage.removeItem(WIDGET_STORAGE_KEY);
    window.localStorage.removeItem(DECISION_STORAGE_KEY);
  } catch {
    // Ignored for the same reason as above.
  }
}
