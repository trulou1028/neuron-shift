import { ControlButton } from "@xyflow/react";
import { Broom } from "@phosphor-icons/react";

/** Clears pinned cards and recorded decisions, so the prototype can be reset between runs. */
export function ClearBoardControl({ onClear, disabled }: { onClear: () => void; disabled: boolean }) {
  return (
    <ControlButton onClick={onClear} disabled={disabled} title="Clear pins and decisions" aria-label="Clear pins and decisions">
      <Broom size={13} weight="bold" />
    </ControlButton>
  );
}
