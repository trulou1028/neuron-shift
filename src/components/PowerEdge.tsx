import type { CSSProperties } from "react";
import { getSmoothStepPath, type Edge, type EdgeProps } from "@xyflow/react";

/**
 * normal: power flows at rest pace.
 * traced: on the investigated path, so it flows faster and in the condition color.
 * dead: would lose power in the failure preview. The flow stops and the rail goes dark.
 * muted: outside the failure preview, pushed back so the preview reads.
 */
export type PowerEdgeState = "normal" | "traced" | "dead" | "muted";
export type PowerEdgeData = { state: PowerEdgeState; depth: number };
export type PowerEdgeType = Edge<PowerEdgeData, "power">;

export function PowerEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<PowerEdgeType>) {
  const [path] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 8 });
  const state = data?.state ?? "normal";

  return (
    <g className={`power-edge power-edge--${state}`} style={{ "--depth": data?.depth ?? 0 } as CSSProperties}>
      {/* pathLength normalizes the rail so the power-up can draw it from 0 to 1 regardless of its length. */}
      <path className="power-edge__rail" d={path} pathLength={1} />
      <path className="power-edge__flow" d={path} />
    </g>
  );
}
