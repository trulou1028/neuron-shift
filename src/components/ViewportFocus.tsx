import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

export type FocusRequest = { id: string; token: number };

/**
 * Pans and zooms the graph onto one node when a new request arrives.
 * Rendered inside <ReactFlow> so it shares the graph's own store, the same way the controls do.
 * `token` lets the same node be focused twice in a row.
 */
export function ViewportFocus({ request }: { request: FocusRequest | null }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!request) return;
    // Wait one frame so the render that carried this request has fully committed.
    const frame = window.requestAnimationFrame(() => {
      void fitView({ nodes: [{ id: request.id }], maxZoom: 0.95, duration: 500 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [request, fitView]);

  return null;
}
