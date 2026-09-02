import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BookOpenText, ClipboardText } from "@phosphor-icons/react";
import { handoffByNode, type PowerNode } from "../data/scenario";

export function PowerNodeCard({ id, data, selected }: NodeProps<PowerNode>) {
  const handoff = handoffByNode.get(id);

  return (
    <div className={`power-node power-node--${data.status} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="power-node__header">
        <strong>{data.title}</strong>
        <span className="power-node__flags">
          {handoff && (
            <span className="power-node__handoff" role="img" aria-label="Handoff decision on record" title="Handoff decision on record">
              <ClipboardText size={12} weight="fill" />
            </span>
          )}
          <span className={`status-dot status-dot--${data.status}`} role="img" aria-label={data.status} />
        </span>
      </div>
      <b className="power-node__metric">{data.metric}</b>
      <span className="power-node__label">{data.metricLabel}</span>
      <span className="power-node__learn" aria-hidden="true">
        <BookOpenText size={14} weight="bold" />
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
