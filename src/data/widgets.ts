export type WidgetKind = "decision" | "impact" | "handoff";

/**
 * Offset is stored relative to the anchor asset, so a pinned card travels with it.
 * `align: "start"` places the card's top-left corner at the offset, for cards to the right of an asset.
 * `align: "end"` places its top-right corner there, for cards to the left, whatever the card's width.
 */
export type PinnedWidget = {
  id: string;
  kind: WidgetKind;
  node: string;
  align: "start" | "end";
  offset: { x: number; y: number };
};

export const WIDGET_NODE_WIDTH = 176;
export const WIDGET_GAP = 12;
export const WIDGET_ROW_HEIGHT = 150;

/**
 * Where a newly pinned card lands: beside its asset, stacked downward over any siblings.
 * Assets in the left column get cards on their left, everything else on the right, so a card
 * lands in open canvas rather than on the next asset in the path.
 */
export function defaultPlacement(anchorX: number, siblingCount: number): Pick<PinnedWidget, "align" | "offset"> {
  const y = siblingCount * WIDGET_ROW_HEIGHT;
  return anchorX < -150
    ? { align: "end", offset: { x: -WIDGET_GAP, y } }
    : { align: "start", offset: { x: WIDGET_NODE_WIDTH + WIDGET_GAP, y } };
}
