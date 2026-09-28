import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { connections } from "../data/scenario";

export type FocusRequest = { id: string; token: number };

/**
 * Pans and zooms the graph onto one node and its neighbors when a new request arrives.
 * Rendered inside <ReactFlow> so it shares the graph's own store, the same way the controls do.
 * `token` lets the same node be focused twice in a row.
 */
export function ViewportFocus({ request }: { request: FocusRequest | null }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!request) return;
    // Wait one frame so the render that carried this request has fully committed.
    const frame = window.requestAnimationFrame(() => {
      // Frame the asset with what feeds it and what it feeds, so the operator lands with context.
      const neighbors = connections.flatMap(([source, target]) =>
        source === request.id ? [target] : target === request.id ? [source] : [],
      );
      const ids = [request.id, ...neighbors].map((id) => ({ id }));
      void fitView({ nodes: ids, maxZoom: 0.95, padding: 0.12, duration: 600 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [request, fitView]);

  return null;
}
