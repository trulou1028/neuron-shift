import { useEffect } from "react";
import { useReactFlow, useStore } from "@xyflow/react";

/**
 * Refits the graph when the canvas changes size, so a window resize never leaves assets off screen.
 * Rendered inside <ReactFlow> so it shares the graph's own store.
 */
export function FitOnResize() {
  const { fitView } = useReactFlow();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);

  useEffect(() => {
    if (!width || !height) return;
    const timer = window.setTimeout(() => void fitView({ padding: 0.08, duration: 300 }), 180);
    return () => window.clearTimeout(timer);
  }, [width, height, fitView]);

  return null;
}
