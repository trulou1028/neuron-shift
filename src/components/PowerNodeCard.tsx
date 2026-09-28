import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BookOpenText, Check, ClipboardText, Gavel, LightningSlash, ShieldCheck, X } from "@phosphor-icons/react";
import { handoffByNode, type PowerNode } from "../data/scenario";

const impactTag = {
  failed: { icon: <X size={11} weight="bold" />, label: "If this fails" },
  dropped: { icon: <LightningSlash size={11} weight="bold" />, label: "Loses power" },
  held: { icon: <ShieldCheck size={11} weight="bold" />, label: "Held by redundancy" },
} as const;

export function PowerNodeCard({ id, data, selected }: NodeProps<PowerNode>) {
  const handoff = handoffByNode.get(id);
  // While the failure preview is on it owns the card footer. State is always named, never only colored.
  const footer = data.impact
    ? { className: `power-node__tag power-node__tag--${data.impact}`, ...impactTag[data.impact] }
    : data.review === "review"
      ? { className: "power-node__tag power-node__tag--review", icon: <Gavel size={11} weight="fill" />, label: "Needs your decision" }
      : data.review === "decided"
        ? { className: "power-node__tag power-node__tag--decided", icon: <Check size={11} weight="bold" />, label: "Decided by you" }
        : null;

  return (
    <div className={`power-node power-node--${data.status} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <div className="power-node__header">
        <span className="power-node__eyebrow">{data.eyebrow}</span>
        <span className="power-node__flags">
          {handoff && (
            <span className="power-node__handoff" role="img" aria-label="Handoff decision on record" title="Handoff decision on record">
              <ClipboardText size={12} weight="fill" />
            </span>
          )}
          <span className={`status-led status-led--${data.status}`} role="img" aria-label={data.status === "warning" ? "Watch" : "Healthy"} />
        </span>
      </div>
      <strong className="power-node__title">{data.title}</strong>
      <div className="power-node__reading">
        <b className="power-node__metric">{data.metric}</b>
        <span className="power-node__label">{data.metricLabel}</span>
      </div>
      {footer && (
        <span className={footer.className}>
          {footer.icon} {footer.label}
        </span>
      )}
      <span className="power-node__learn" aria-hidden="true">
        <BookOpenText size={13} weight="bold" />
      </span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
