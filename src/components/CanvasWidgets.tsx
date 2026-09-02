import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ViewportPortal, useStore } from "@xyflow/react";
import { ClipboardText, Crosshair, DotsSixVertical, Gavel, PushPinSlash } from "@phosphor-icons/react";
import { handoffByNode, impactByNode, titleOf, type PowerNode } from "../data/scenario";
import { decisionLabel, type OperatorDecision } from "../data/decisions";
import type { PinnedWidget } from "../data/widgets";

const CARD_WIDTH = 232;
/** Below this zoom a full card swamps the graph, so widgets collapse to a pill. */
const COLLAPSE_BELOW = 0.72;
/** Pointer travel that separates a click from a drag. */
const DRAG_THRESHOLD = 4;

type CanvasWidgetsProps = {
  widgets: PinnedWidget[];
  nodes: PowerNode[];
  decisions: OperatorDecision[];
  onUnpin: (id: string) => void;
  onMove: (id: string, offset: { x: number; y: number }) => void;
  onSelect: (nodeId: string) => void;
};

export function CanvasWidgets({ widgets, nodes, decisions, onUnpin, onMove, onSelect }: CanvasWidgetsProps) {
  const zoom = useStore((state) => state.transform[2]);
  if (widgets.length === 0) return null;

  const collapsed = zoom < COLLAPSE_BELOW;

  return (
    <ViewportPortal>
      {widgets.map((widget) => {
        const anchor = nodes.find((node) => node.id === widget.node);
        if (!anchor) return null;
        return (
          <WidgetCard
            key={widget.id}
            widget={widget}
            anchor={anchor}
            zoom={zoom}
            collapsed={collapsed}
            decisions={decisions}
            onUnpin={onUnpin}
            onMove={onMove}
            onSelect={onSelect}
          />
        );
      })}
    </ViewportPortal>
  );
}

function WidgetCard({
  widget,
  anchor,
  zoom,
  collapsed,
  decisions,
  onUnpin,
  onMove,
  onSelect,
}: {
  widget: PinnedWidget;
  anchor: PowerNode;
  zoom: number;
  collapsed: boolean;
  decisions: OperatorDecision[];
  onUnpin: (id: string) => void;
  onMove: (id: string, offset: { x: number; y: number }) => void;
  onSelect: (nodeId: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);

  // Screen pixels are divided by zoom because the offset is stored in flow coordinates.
  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button[data-no-drag]")) return;

    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...widget.offset };
    const target = event.currentTarget;
    movedRef.current = false;
    target.setPointerCapture(event.pointerId);

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      movedRef.current = true;
      setDragging(true);
      onMove(widget.id, { x: origin.x + dx / zoom, y: origin.y + dy / zoom });
    };

    const handleUp = () => {
      target.releasePointerCapture(event.pointerId);
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
      target.removeEventListener("pointercancel", handleUp);
      setDragging(false);
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
    target.addEventListener("pointercancel", handleUp);
  };

  const decision = decisions.find((item) => item.node === widget.node);
  const handoff = handoffByNode.get(widget.node);
  const impact = impactByNode.get(widget.node);

  const meta =
    widget.kind === "decision"
      ? { icon: <Gavel size={12} weight="fill" />, title: decision ? decisionLabel[decision.kind] : "Decision" }
      : widget.kind === "handoff"
        ? { icon: <ClipboardText size={12} weight="fill" />, title: "From handoff" }
        : { icon: <Crosshair size={12} weight="bold" />, title: "If this fails" };

  return (
    <div
      className={`canvas-widget nopan canvas-widget--${widget.kind} ${collapsed ? "is-collapsed" : ""} ${dragging ? "is-dragging" : ""}`}
      style={{
        position: "absolute",
        transform: `translate(${anchor.position.x + widget.offset.x}px, ${anchor.position.y + widget.offset.y}px) scale(${1 / zoom})`,
        transformOrigin: "top left",
        width: collapsed ? "auto" : CARD_WIDTH,
      }}
      onPointerDown={startDrag}
      // A drag must not also read as a click on the pill underneath.
      onClickCapture={(event) => {
        if (movedRef.current) {
          event.preventDefault();
          event.stopPropagation();
          movedRef.current = false;
        }
      }}
    >
      {collapsed ? (
        <button className="canvas-widget__pill" onClick={() => onSelect(widget.node)}>
          {meta.icon}
          {meta.title}
        </button>
      ) : (
        <>
          <div className="canvas-widget__head">
            <DotsSixVertical size={12} weight="bold" className="canvas-widget__grip" />
            {meta.icon}
            <span>{meta.title}</span>
            <button data-no-drag aria-label="Unpin from canvas" title="Unpin from canvas" onClick={() => onUnpin(widget.id)}>
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
      )}
    </div>
  );
}
