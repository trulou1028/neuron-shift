import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CaretDown, ClipboardText, FlowArrow } from "@phosphor-icons/react";
import { shiftHandoff, type HandoffItem } from "../data/scenario";
import { decisionLabel, type OperatorDecision } from "../data/decisions";
import { trapFocus } from "../focusTrap";
import { backdropMotion, dialogMotion, disclosureMotion } from "../motion";

type ShiftBriefProps = {
  minutesSinceHandoff: number;
  decisions: OperatorDecision[];
  openItem: string | null;
  onToggleItem: (id: string | null) => void;
  onStartShift: () => void;
  onOpenOnGraph: (item: HandoffItem) => void;
};

const changeKindLabel = { new: "New", changed: "Changed", resolved: "Resolved", unchanged: "No change" } as const;

export function ShiftBrief({ minutesSinceHandoff, decisions, openItem, onToggleItem, onStartShift, onOpenOnGraph }: ShiftBriefProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const attention = shiftHandoff.items.filter((item) => item.status === "attention").length;

  // Land keyboard users on the primary action without scrolling the greeting away.
  // On close, return focus to the control that reopens the brief.
  useEffect(() => {
    document.getElementById("start-shift")?.focus({ preventScroll: true });
    return () => document.getElementById("open-shift-brief")?.focus({ preventScroll: true });
  }, []);

  // An opened item can grow past the bottom of the scroll area. Bring it, and its "Open on graph" action, into view.
  useEffect(() => {
    if (!openItem) return;
    const timer = window.setTimeout(() => {
      const item = bodyRef.current?.querySelector(`[data-tour="handoff-${openItem}"]`);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      item?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [openItem]);

  // Listening on the window keeps Escape and the focus loop working while focus sits in the tour card.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onStartShift();
      else trapFocus(event, dialogRef.current);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStartShift]);

  return (
    <motion.div className="backdrop" {...backdropMotion}>
      <motion.section
        ref={dialogRef}
        className="shift-brief"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-brief-title"
        {...dialogMotion}
      >
        <header className="shift-brief__head">
          <div className="shift-brief__meta">
            <ClipboardText size={14} weight="fill" />
            <span>Shift handoff</span>
            <span className="mono">{shiftHandoff.site}</span>
            <span className="mono">{shiftHandoff.handoffTime}</span>
            <span className="mono">{minutesSinceHandoff} min ago</span>
          </div>
          <h2 id="shift-brief-title">Good evening, {shiftHandoff.incoming}</h2>
          <p className="shift-brief__sub">
            {shiftHandoff.outgoing} handed you the site. Here is what changed, what was decided, and why, before you take control.
          </p>
          <div className="shift-status">
            <span className="tag tag--condition">Facility: {shiftHandoff.facilityStatus}</span>
            <span className="tag">{shiftHandoff.redundancy}</span>
            <span className="tag">
              <span className="mono">{attention}</span> need attention · <span className="mono">{shiftHandoff.items.length - attention}</span> resolved
            </span>
          </div>
        </header>

        {/* Only the middle scrolls, so "Start shift" stays in view on any screen height. */}
        <div className="dialog-body" ref={bodyRef}>
          <ol className="handoff-list">
            {shiftHandoff.items.map((item, index) => {
              const open = openItem === item.id;
              return (
                <li key={item.id} className={`handoff-item ${open ? "is-open" : ""}`} data-tour={`handoff-${item.id}`}>
                  <button
                    className="handoff-item__head"
                    aria-expanded={open}
                    aria-controls={`handoff-${item.id}`}
                    onClick={() => onToggleItem(open ? null : item.id)}
                  >
                    <span className="handoff-item__num mono">{String(index + 1).padStart(2, "0")}</span>
                    <span className="handoff-item__text">
                      <span>{item.title}</span>
                      <small className={open ? "is-hidden" : ""}>{item.next}</small>
                    </span>
                    <span className="handoff-item__meta">
                      <span className={`tag ${item.status === "attention" ? "tag--condition" : "tag--flow"}`}>
                        {item.status === "attention" ? "Needs attention" : "Resolved"}
                      </span>
                      <CaretDown size={14} className="caret" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div id={`handoff-${item.id}`} className="disclosure" {...disclosureMotion}>
                        <dl className="decision-record">
                          <dt>What changed</dt><dd>{item.changed}</dd>
                          <dt>What we know</dt><dd>{item.known}</dd>
                          <dt>What was decided</dt><dd>{item.decided}</dd>
                          <dt>Why</dt><dd>{item.why}</dd>
                          <dt>Who decided</dt><dd className="mono-soft">{item.who}</dd>
                          <dt>What you need to do</dt><dd className="is-next">{item.next}</dd>
                        </dl>
                        <div className="handoff-item__actions">
                          <button className="button button--secondary" data-tour="open-on-graph" onClick={() => onOpenOnGraph(item)}>
                            <FlowArrow size={14} weight="bold" /> Open on graph
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>

          <section className="shift-changes">
            <h3>What changed since <span className="mono">{shiftHandoff.changesSince}</span></h3>
            <ul className="change-list">
              {shiftHandoff.changes.map((change) => (
                <li key={change.label}>
                  <span className={`change-kind change-kind--${change.kind}`}>{changeKindLabel[change.kind]}</span>
                  <span><b>{change.label}</b> {change.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          {decisions.length > 0 && (
            <section className="shift-changes">
              <h3>Decisions you are handing on</h3>
              <ul className="change-list">
                {decisions.map((decision) => (
                  <li key={decision.recommendationId}>
                    <span className={`change-kind change-kind--decision-${decision.kind}`}>{decisionLabel[decision.kind]}</span>
                    <span>
                      <b>{decision.headline}</b>
                      {decision.detail ? ` ${decision.detail}.` : ""}
                      {decision.reason ? ` ${decision.reason}.` : ""}
                      <span className="mono-soft"> You, {decision.at}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        <footer className="shift-brief__footer">
          <small>
            Independent concept prototype, not affiliated with or endorsed by any company.<br />
            Simulated handoff. Names, times, and thresholds are fictional.
          </small>
          <button id="start-shift" className="button button--primary button--large" onClick={onStartShift}>
            Start shift <ArrowRight size={15} weight="bold" />
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}
