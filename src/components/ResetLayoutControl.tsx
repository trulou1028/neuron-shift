import { ControlButton, useReactFlow } from "@xyflow/react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";

export function ResetLayoutControl({ onReset }: { onReset: () => void }) {
  const { fitView } = useReactFlow();

  return (
    <ControlButton
      onClick={() => {
        onReset();
        // Positions are restored by a state update, so measure on the next frame.
        window.requestAnimationFrame(() => void fitView({ padding: 0.06, duration: 320 }));
      }}
      title="Reset layout"
      aria-label="Reset layout"
    >
      <ArrowCounterClockwise size={13} weight="bold" />
    </ControlButton>
  );
}
