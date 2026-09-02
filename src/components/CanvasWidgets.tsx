import { ViewportPortal, useStore } from "@xyflow/react";
import { ClipboardText, Crosshair, PushPinSlash, Gavel } from "@phosphor-icons/react";
import { handoffByNode, impactByNode, titleOf, type PowerNode } from "../data/scenario";
import { decisionLabel, type OperatorDecision } from "../data/decisions";

export type WidgetKind = "decision" | "impact" | "handoff";
export type PinnedWidget = { id: string; kind: WidgetKind; node: string };

const NODE_WIDTH = 176;
const GAP = 18;
const CARD_WIDTH = 232;
const ROW_HEIGHT = 128;
/** Below this zoom a full card swamps the graph, so widgets collapse to a pill. */
const COLLAPSE_BELOW = 0.72;

type CanvasWidgetsProps = {
  widgets: PinnedWidget[];
  nodes: PowerNode[];
  decisions: OperatorDecision[];
  onUnpin: (id: string) => void;
  onSelect: (nodeId: string) => void;
};

export function CanvasWidgets({ widgets, nodes, decisions, onUnpin, onSelect }: CanvasWidgetsProps) {
  const zoom = useStore((state) => state.transform[2]);
  if (widgets.length === 0) return null;

  const collapsed = zoom < COLLAPSE_BELOW;
  // Counter-scale so pinned text stays legible at any zoom, the way map labels behave.
  const scale = 1 / zoom;

  return (
    <ViewportPortal>
      {widgets.map((widget) => {
        const anchor = nodes.find((node) => node.id === widget.node);
        if (!anchor) return null;

        const siblings = widgets.filter((item) => item.node === widget.node);
        const row = siblings.findIndex((item) => item.id === widget.id);
        const x = anchor.position.x + NODE_WIDTH + GAP;
        const y = anchor.position.y + row * (ROW_HEIGHT + 10);

        return (
          <div
            key={widget.id}
            className={`canvas-widget canvas-widget--${widget.kind} ${collapsed ? "is-collapsed" : ""}`}
            style={{
              position: "absolute",
              transform: `translate(${x}px, ${y}px) scale(${scale})`,
              transformOrigin: "top left",
              width: CARD_WIDTH,
            }}
          >
            <WidgetBody
              widget={widget}
              collapsed={collapsed}
              decisions={decisions}
              onUnpin={onUnpin}
              onSelect={onSelect}
            />
          </div>
        );
      })}
    </ViewportPortal>
  );
}

function WidgetBody({
  widget,
  collapsed,
  decisions,
  onUnpin,
  onSelect,
}: {
  widget: PinnedWidget;
  collapsed: boolean;
  decisions: OperatorDecision[];
  onUnpin: (id: string) => void;
  onSelect: (nodeId: string) => void;
}) {
  const decision = decisions.find((item) => item.node === widget.node);
  const handoff = handoffByNode.get(widget.node);
  const impact = impactByNode.get(widget.node);

  const meta =
    widget.kind === "decision"
      ? { icon: <Gavel size={12} weight="fill" />, title: decision ? decisionLabel[decision.kind] : "Decision" }
      : widget.kind === "handoff"
        ? { icon: <ClipboardText size={12} weight="fill" />, title: "From handoff" }
        : { icon: <Crosshair size={12} weight="bold" />, title: "If this fails" };

  if (collapsed) {
    return (
      <button className="canvas-widget__pill" onClick={() => onSelect(widget.node)}>
        {meta.icon}
        {meta.title}
      </button>
    );
  }

  return (
    <>
      <div className="canvas-widget__head">
        {meta.icon}
        <span>{meta.title}</span>
        <button aria-label="Unpin from canvas" title="Unpin from canvas" onClick={() => onUnpin(widget.id)}>
          <PushPinSlash size={12} weight="bold" />
        </button>
      </div>
      <div className="canvas-widget__body">
        {widget.kind === "decision" && decision && (
          <>
            <p className="canvas-widget__lead">{decision.headline}</p>
            {decision.detail && <p>{decision.detail}</p>}
            <span className="canvas-widget__foot">You · {decision.at}</span>
          </>
        )}
        {widget.kind === "handoff" && handoff && (
          <>
            <p className="canvas-widget__lead">{handoff.decided}</p>
            <p>{handoff.next}</p>
            <span className="canvas-widget__foot">{handoff.who}</span>
          </>
        )}
        {widget.kind === "impact" && impact && (
          <>
            <p className="canvas-widget__lead">
              {impact.dropped.length} lose power · {impact.held.length} held
            </p>
            <p>{impact.dropped.length > 0 ? impact.dropped.map(titleOf).join(", ") : "Redundancy covers every downstream asset."}</p>
          </>
        )}
      </div>
    </>
  );
}
