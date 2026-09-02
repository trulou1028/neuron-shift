import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, CaretDown, ClipboardText, FlowArrow } from "@phosphor-icons/react";
import { shiftHandoff, type HandoffItem } from "../data/scenario";

type ShiftBriefProps = {
  minutesSinceHandoff: number;
  onStartShift: () => void;
  onOpenOnGraph: (item: HandoffItem) => void;
};

const changeKindLabel = { new: "New", changed: "Changed", resolved: "Resolved", unchanged: "No change" } as const;
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ShiftBrief({ minutesSinceHandoff, onStartShift, onOpenOnGraph }: ShiftBriefProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const attention = shiftHandoff.items.filter((item) => item.status === "attention").length;

  // Land keyboard users on the primary action without scrolling the greeting away.
  // On close, return focus to the control that reopens the brief.
  useEffect(() => {
    document.getElementById("start-shift")?.focus({ preventScroll: true });
    return () => document.getElementById("open-shift-brief")?.focus({ preventScroll: true });
  }, []);

  // Keep Tab inside the dialog while it is open. Escape closes it.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      onStartShift();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="shift-backdrop" onKeyDown={handleKeyDown}>
      <section ref={dialogRef} className="shift-brief" role="dialog" aria-modal="true" aria-labelledby="shift-brief-title">
        <div className="shift-brief__eyebrow">
          <ClipboardText size={15} weight="fill" /> Shift handoff · {shiftHandoff.site} · {shiftHandoff.handoffTime} · {minutesSinceHandoff} min ago
        </div>
        <h2 id="shift-brief-title">Good evening, {shiftHandoff.incoming}</h2>
        <p className="shift-brief__sub">
          {shiftHandoff.outgoing} handed you the site. Here is what changed, what was decided, and why, before you take control.
        </p>

        <div className="shift-status">
          <span className="is-watch">Facility: {shiftHandoff.facilityStatus}</span>
          <span>{shiftHandoff.redundancy}</span>
          <span>{attention} need attention · {shiftHandoff.items.length - attention} resolved</span>
        </div>

        <div className="handoff-list">
          {shiftHandoff.items.map((item, index) => {
            const open = openItem === item.id;
            return (
              <article key={item.id} className={`handoff-item ${open ? "is-open" : ""}`}>
                <button
                  className="handoff-item__head"
                  aria-expanded={open}
                  aria-controls={`handoff-${item.id}`}
                  onClick={() => setOpenItem(open ? null : item.id)}
                >
                  <span className="handoff-item__num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="handoff-item__text">
                    <span>{item.title}</span>
                    {!open && <small>{item.next}</small>}
                  </span>
                  <span className="handoff-item__meta">
                    <span className={`handoff-item__tag ${item.status}`}>{item.status === "attention" ? "Needs attention" : "Resolved"}</span>
                    <CaretDown size={14} />
                  </span>
                </button>
                {open && (
                  <div id={`handoff-${item.id}`}>
                    <dl className="decision-record">
                      <dt>What changed</dt><dd>{item.changed}</dd>
                      <dt>What we know</dt><dd>{item.known}</dd>
                      <dt>What was decided</dt><dd>{item.decided}</dd>
                      <dt>Why</dt><dd>{item.why}</dd>
                      <dt>Who decided</dt><dd>{item.who}</dd>
                      <dt>What you need to do</dt><dd className="is-next">{item.next}</dd>
                    </dl>
                    <div className="handoff-item__actions">
                      <button onClick={() => onOpenOnGraph(item)}>
                        <FlowArrow size={14} weight="bold" /> Open on graph
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="shift-changes">
          <h3>What changed since {shiftHandoff.changesSince}</h3>
          <ul className="change-list">
            {shiftHandoff.changes.map((change) => (
              <li key={change.label}>
                <span className={`change-kind change-kind--${change.kind}`}>{changeKindLabel[change.kind]}</span>
                <span><b>{change.label}</b> · {change.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="shift-brief__footer">
          <small>Simulated handoff. Names, times, and thresholds are fictional.</small>
          <button id="start-shift" className="start-shift" onClick={onStartShift}>
            Start shift <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </section>
    </div>
  );
}
