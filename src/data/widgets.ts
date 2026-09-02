export type WidgetKind = "decision" | "impact" | "handoff";

/** Offset is stored relative to the anchor asset, so a pinned card travels with it. */
export type PinnedWidget = {
  id: string;
  kind: WidgetKind;
  node: string;
  offset: { x: number; y: number };
};

export const WIDGET_NODE_WIDTH = 176;
export const WIDGET_GAP = 18;
export const WIDGET_ROW_HEIGHT = 138;

/** Where a newly pinned card lands: to the right of its asset, stacked under any siblings. */
export function defaultOffset(siblingCount: number) {
  return { x: WIDGET_NODE_WIDTH + WIDGET_GAP, y: siblingCount * WIDGET_ROW_HEIGHT };
}
