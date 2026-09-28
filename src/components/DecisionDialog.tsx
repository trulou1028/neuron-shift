import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowCounterClockwise, Brain, Check, LockSimple, Seal, ShieldWarning, X } from "@phosphor-icons/react";
import {
  decisionLabel,
  overrideReasons,
  tierLabel,
  type ActionTier,
  type DecisionKind,
  type OperatorDecision,
  type Recommendation,
} from "../data/decisions";
import { titleOf } from "../data/scenario";
import { firstFocusable, trapFocus } from "../focusTrap";
import { backdropMotion, dialogMotion, disclosureMotion } from "../motion";

type DecisionDialogProps = {
  recommendation: Recommendation;
  now: string;
  onClose: () => void;
  onDecide: (decision: OperatorDecision) => void;
};

const tierOrder: ActionTier[] = ["auto", "approval", "never"];
const choiceLabel: Record<DecisionKind, string> = {
  approved: "Approve",
  deferred: "Defer with a trigger",
  modified: "Approve with changes",
  rejected: "Reject",
};

export function DecisionDialog({ recommendation, now, onClose, onDecide }: DecisionDialogProps) {
  const [kind, setKind] = useState<DecisionKind | null>(null);
  const [detail, setDetail] = useState("");
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const dialogRef = useRef<HTMLElement>(null);

  const consequential = recommendation.reversibility === "consequential";
  // The operator types the asset's name as it appears on the graph, not an internal id.
  const confirmPhrase = titleOf(recommendation.node).toUpperCase();

  useEffect(() => {
    firstFocusable(dialogRef.current)?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else trapFocus(event, dialogRef.current);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Switching intent invalidates anything gathered for the previous one.
  const choose = (next: DecisionKind) => {
    setKind(next);
    setDetail("");
    setReason("");
    setAcknowledged([]);
    setTyped("");
  };

  // Friction scales with what the action costs to undo. A reversible change is one click.
  // A consequential one needs every step acknowledged and the asset typed back.
  const typedMatches = typed.trim().toUpperCase() === confirmPhrase;
  const readyToCommit = (() => {
    if (kind === null) return false;
    if (kind === "deferred") return detail !== "";
    if (kind === "rejected") return reason !== "";
    if (kind === "modified") return detail !== "" && reason !== "";
    if (!consequential) return true;
    return acknowledged.length === recommendation.steps.length && typedMatches;
  })();

  const commit = () => {
    if (!kind || !readyToCommit) return;
    onDecide({
      recommendationId: recommendation.id,
      node: recommendation.node,
      headline: recommendation.headline,
      kind,
      detail,
      reason,
      at: now,
    });
  };

  const gateProgress = acknowledged.length + (typedMatches ? 1 : 0);
  const gateTotal = recommendation.steps.length + 1;

  return (
    <motion.div className="backdrop" {...backdropMotion}>
      <motion.section
        ref={dialogRef}
        className="decision-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        {...dialogMotion}
      >
        <header className="decision-dialog__head">
          <div>
            <div className="decision-dialog__eyebrow"><Brain size={14} weight="duotone" /> Neuron recommends</div>
            <h2 id="decision-title">{recommendation.headline}</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </header>

        {/* Only the middle scrolls, so the commit button stays in view on any screen height. */}
        <div className="dialog-body">
          <p className="decision-rationale">{recommendation.rationale}</p>

          <div className="decision-meta">
            <span className="tag tag--ai">Confidence <span className="mono">{recommendation.confidence.toFixed(2)}</span></span>
            <span className={consequential ? "tag tag--owed" : "tag"}>
              {consequential ? <ShieldWarning size={12} weight="fill" /> : <ArrowCounterClockwise size={12} weight="bold" />}
              {consequential ? "Consequential and hard to undo" : "Reversible change"}
            </span>
          </div>

          <div className="autonomy">
            <h3><LockSimple size={12} weight="fill" /> What Neuron may do here</h3>
            {tierOrder.map((tier) => {
              const items = recommendation.autonomy.filter((item) => item.tier === tier);
              if (items.length === 0) return null;
              return (
                <div key={tier} className={`autonomy-row autonomy-row--${tier}`}>
                  <span><i aria-hidden="true" /> {tierLabel[tier]}</span>
                  <ul>{items.map((item) => <li key={item.label}>{item.label}</li>)}</ul>
                </div>
              );
            })}
          </div>

          <div className="decision-choices" role="group" aria-label="Your decision">
            {(["approved", "deferred", "modified", "rejected"] as DecisionKind[]).map((option) => (
              <button key={option} className={kind === option ? "is-picked" : ""} aria-pressed={kind === option} onClick={() => choose(option)}>
                {kind === option && <motion.span layoutId="decision-choice" className="decision-choices__indicator" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} />}
                <span>{choiceLabel[option]}</span>
              </button>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {kind && (
              <motion.div key={kind} className="disclosure" {...disclosureMotion}>
                {kind === "deferred" && (
                  <fieldset className="decision-detail">
                    <legend>Revisit when</legend>
                    {recommendation.deferTriggers.map((trigger) => (
                      <label key={trigger}>
                        <input type="radio" name="trigger" checked={detail === trigger} onChange={() => setDetail(trigger)} />
                        {trigger}
                      </label>
                    ))}
                  </fieldset>
                )}

                {kind === "modified" && (
                  <fieldset className="decision-detail">
                    <legend>Change</legend>
                    {recommendation.modifyOptions.map((option) => (
                      <label key={option}>
                        <input type="radio" name="modify" checked={detail === option} onChange={() => setDetail(option)} />
                        {option}
                      </label>
                    ))}
                  </fieldset>
                )}

                {(kind === "rejected" || kind === "modified") && (
                  <fieldset className="decision-detail">
                    <legend>Why you disagreed{kind === "rejected" ? "" : " with the original"}</legend>
                    <p className="decision-hint">An override is the most useful thing this system can learn from, so it is recorded.</p>
                    {overrideReasons.map((option) => (
                      <label key={option}>
                        <input type="radio" name="reason" checked={reason === option} onChange={() => setReason(option)} />
                        {option}
                      </label>
                    ))}
                  </fieldset>
                )}

                {kind === "approved" && consequential && (
                  <fieldset className="decision-detail decision-detail--gate">
                    <legend>
                      Confirm before this leaves the screen
                      <span className="gate-count mono" aria-label={`${gateProgress} of ${gateTotal} confirmed`}>{gateProgress}/{gateTotal}</span>
                    </legend>
                    <p className="decision-hint">Neuron will not perform this action. You are recording that you will.</p>
                    {recommendation.steps.map((step) => (
                      <label key={step} className={acknowledged.includes(step) ? "is-checked" : ""}>
                        <input
                          type="checkbox"
                          checked={acknowledged.includes(step)}
                          onChange={() =>
                            setAcknowledged((current) =>
                              current.includes(step) ? current.filter((item) => item !== step) : [...current, step],
                            )
                          }
                        />
                        {step}
                      </label>
                    ))}
                    <label className={`typed-confirm ${typedMatches ? "is-match" : ""}`}>
                      <span>Type <b className="mono">{confirmPhrase}</b> to confirm</span>
                      <span className="typed-confirm__field">
                        <input
                          className="mono"
                          value={typed}
                          onChange={(event) => setTyped(event.target.value)}
                          placeholder={confirmPhrase}
                          aria-label={`Type ${confirmPhrase} to confirm`}
                          spellCheck={false}
                          autoComplete="off"
                        />
                        {typedMatches && <Check size={14} weight="bold" aria-hidden="true" />}
                      </span>
                    </label>
                  </fieldset>
                )}

                {kind === "approved" && !consequential && (
                  <p className="decision-hint decision-hint--inline">
                    Reversible, so one click is enough. Neuron applies the threshold change and records that you approved it.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <footer className="decision-dialog__footer">
          <small>Nothing here is executed. The prototype records the decision only.</small>
          <button className="button button--primary button--large" disabled={!readyToCommit} onClick={commit}>
            <Seal size={15} weight="fill" />
            {kind ? `Record: ${decisionLabel[kind]}` : "Choose a decision"}
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}
