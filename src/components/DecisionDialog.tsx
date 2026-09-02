import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Brain, Check, LockSimple, ShieldWarning, Sparkle, X } from "@phosphor-icons/react";
import {
  decisionLabel,
  overrideReasons,
  tierLabel,
  type ActionTier,
  type DecisionKind,
  type OperatorDecision,
  type Recommendation,
} from "../data/decisions";

type DecisionDialogProps = {
  recommendation: Recommendation;
  now: string;
  onClose: () => void;
  onDecide: (decision: OperatorDecision) => void;
};

const tierOrder: ActionTier[] = ["auto", "approval", "never"];
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

export function DecisionDialog({ recommendation, now, onClose, onDecide }: DecisionDialogProps) {
  const [kind, setKind] = useState<DecisionKind | null>(null);
  const [detail, setDetail] = useState("");
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const dialogRef = useRef<HTMLElement>(null);

  const consequential = recommendation.reversibility === "consequential";
  const confirmPhrase = recommendation.node.toUpperCase();

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
  }, []);

  // Switching intent invalidates anything gathered for the previous one.
  useEffect(() => {
    setDetail("");
    setReason("");
    setAcknowledged([]);
    setTyped("");
  }, [kind]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  };

  // Friction scales with what the action costs to undo. A reversible change is one click.
  // A consequential one needs every step acknowledged and the asset typed back.
  const readyToCommit = (() => {
    if (kind === null) return false;
    if (kind === "deferred") return detail !== "";
    if (kind === "rejected") return reason !== "";
    if (kind === "modified") return detail !== "" && reason !== "";
    if (!consequential) return true;
    return acknowledged.length === recommendation.steps.length && typed.trim().toUpperCase() === confirmPhrase;
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

  return (
    <div className="shift-backdrop" onKeyDown={handleKeyDown}>
      <section ref={dialogRef} className="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <div className="decision-dialog__head">
          <div>
            <div className="decision-dialog__eyebrow"><Brain size={15} weight="duotone" /> Neuron recommends</div>
            <h2 id="decision-title">{recommendation.headline}</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="decision-rationale">{recommendation.rationale}</p>

        <div className="decision-meta">
          <span className="confidence-pill">Confidence {recommendation.confidence.toFixed(2)}</span>
          <span className={consequential ? "risk-pill is-high" : "risk-pill"}>
            {consequential ? <ShieldWarning size={13} weight="fill" /> : <Check size={13} weight="bold" />}
            {consequential ? "Consequential and hard to undo" : "Reversible change"}
          </span>
        </div>

        <div className="autonomy">
          <h3><LockSimple size={13} weight="fill" /> What Neuron may do here</h3>
          {tierOrder.map((tier) => {
            const items = recommendation.autonomy.filter((item) => item.tier === tier);
            if (items.length === 0) return null;
            return (
              <div key={tier} className={`autonomy-row autonomy-row--${tier}`}>
                <span>{tierLabel[tier]}</span>
                <ul>{items.map((item) => <li key={item.label}>{item.label}</li>)}</ul>
              </div>
            );
          })}
        </div>

        <div className="decision-choices" role="group" aria-label="Your decision">
          {(["approved", "deferred", "modified", "rejected"] as DecisionKind[]).map((option) => (
            <button
              key={option}
              className={kind === option ? "is-picked" : ""}
              aria-pressed={kind === option}
              onClick={() => setKind(option)}
            >
              {option === "approved" ? "Approve" : option === "deferred" ? "Defer with a trigger" : option === "modified" ? "Approve with changes" : "Reject"}
            </button>
          ))}
        </div>

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
            <legend>Confirm before this leaves the screen</legend>
            <p className="decision-hint">Neuron will not perform this action. You are recording that you will.</p>
            {recommendation.steps.map((step) => (
              <label key={step}>
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
            <label className="typed-confirm">
              <span>Type <b>{confirmPhrase}</b> to confirm</span>
              <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder={confirmPhrase} aria-label={`Type ${confirmPhrase} to confirm`} />
            </label>
          </fieldset>
        )}

        {kind === "approved" && !consequential && (
          <p className="decision-hint decision-hint--inline">
            Reversible, so one click is enough. Neuron applies the threshold change and records that you approved it.
          </p>
        )}

        <div className="decision-dialog__footer">
          <small>Nothing here is executed. The prototype records the decision only.</small>
          <button className="start-shift" disabled={!readyToCommit} onClick={commit}>
            <Sparkle size={15} weight="fill" />
            {kind ? `Record: ${decisionLabel[kind]}` : "Choose a decision"}
          </button>
        </div>
      </section>
    </div>
  );
}
