import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Brain,
  CaretDown,
  CircleDashed,
  ClipboardText,
  Crosshair,
  Eye,
  EyeSlash,
  Gavel,
  PushPin,
  Sparkle,
} from "@phosphor-icons/react";
import {
  aiHypothesis,
  asksForNode,
  handoffByNode,
  impactByNode,
  titleOf,
  type LensTab,
  type PowerNode,
} from "../data/scenario";
import { decisionLabel, recommendationByNode, type OperatorDecision } from "../data/decisions";
import type { WidgetKind } from "../data/widgets";
import { disclosureMotion, easeOutQuint, swapMotion } from "../motion";

const lensTabs: { id: LensTab; label: string }[] = [
  { id: "ask", label: "Ask" },
  { id: "evidence", label: "Evidence" },
  { id: "impact", label: "Impact" },
];

type AssetPanelProps = {
  node: PowerNode;
  tab: LensTab;
  onTabChange: (tab: LensTab) => void;
  openAsk: string | null;
  onOpenAsk: (id: string | null) => void;
  traceActive: boolean;
  onShowEvidence: () => void;
  impactActive: boolean;
  onToggleImpact: (next: boolean) => void;
  decision?: OperatorDecision;
  onReviewRecommendation: () => void;
  onPin: (kind: WidgetKind) => void;
  isPinned: (kind: WidgetKind) => boolean;
};

export function AssetPanel({
  node,
  tab,
  onTabChange,
  openAsk,
  onOpenAsk,
  traceActive,
  onShowEvidence,
  impactActive,
  onToggleImpact,
  decision,
  onReviewRecommendation,
  onPin,
  isPinned,
}: AssetPanelProps) {
  // Arrow keys move between tabs, following the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = lensTabs.findIndex((item) => item.id === tab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % lensTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + lensTabs.length) % lensTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lensTabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = lensTabs[nextIndex].id;
    onTabChange(next);
    document.getElementById(`lens-tab-${next}`)?.focus();
  };

  const handoff = handoffByNode.get(node.id);
  const asks = asksForNode(node.id);
  const impact = impactByNode.get(node.id);
  const recommendation = recommendationByNode.get(node.id);

  const pinButton = (kind: WidgetKind) => (
    <button className={`pin-button ${isPinned(kind) ? "is-pinned" : ""}`} aria-pressed={isPinned(kind)} onClick={() => onPin(kind)}>
      <PushPin size={12} weight={isPinned(kind) ? "fill" : "bold"} />
      {isPinned(kind) ? "Pinned to canvas" : "Pin to canvas"}
    </button>
  );

  return (
    <aside className="asset-panel" aria-label="Selected asset">
      <motion.div key={node.id} className="asset-panel__head" {...swapMotion}>
        <div className="asset-panel__top">
          <span className="asset-panel__eyebrow">{node.data.eyebrow}</span>
          <span className={`tag ${node.data.status === "warning" ? "tag--condition" : "tag--flow"}`}>
            <i className="tag__led" aria-hidden="true" />
            {node.data.status === "warning" ? "Watch" : "Healthy"}
          </span>
        </div>
        <h2>{node.data.title}</h2>
        <div className={`asset-reading asset-reading--${node.data.status}`}>
          <strong className="mono">{node.data.metric}</strong>
          <span>{node.data.metricLabel}</span>
        </div>

        {(node.data.assumption || (handoff && tab !== "evidence")) && (
          <div className="asset-panel__chips">
            {node.data.assumption && (
              <span className="assumption-chip" title="A domain assumption an expert should validate">
                <CircleDashed size={12} weight="bold" /> Assumption to validate
              </span>
            )}
            {handoff && tab !== "evidence" && (
              <button className="handoff-chip" onClick={() => onTabChange("evidence")}>
                <ClipboardText size={12} weight="fill" /> Handoff on record · {handoff.who}
              </button>
            )}
          </div>
        )}

        {recommendation && !decision && (
          <div className="rec-card">
            <div className="rec-card__title"><Gavel size={13} weight="fill" /> Neuron recommends · needs your decision</div>
            <p>{recommendation.headline}</p>
            <div className="rec-card__foot">
              <span className="rec-card__meta">
                {recommendation.reversibility === "consequential" ? "Hard to undo" : "Reversible"} · Confidence{" "}
                <span className="mono">{recommendation.confidence.toFixed(2)}</span>
              </span>
              <button className="button button--primary" data-tour="review-decide" onClick={onReviewRecommendation}>
                Review and decide
              </button>
            </div>
          </div>
        )}

        {decision && (
          <div className={`rec-card rec-card--done rec-card--${decision.kind}`}>
            <div className="rec-card__title">
              <Gavel size={13} weight="fill" /> {decisionLabel[decision.kind]} by you · <span className="mono">{decision.at}</span>
            </div>
            <p>{decision.headline}</p>
            {decision.detail && <p className="rec-card__detail">{decision.detail}</p>}
            {decision.reason && <p className="rec-card__detail">Reason: {decision.reason}</p>}
            <div className="rec-card__actions">{pinButton("decision")}</div>
          </div>
        )}
      </motion.div>

      <div className="lens-tabs" role="tablist" aria-label="Asset panel sections" onKeyDown={handleTabKeyDown}>
        {lensTabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`lens-tab-${item.id}`}
            data-tour={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`lens-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => onTabChange(item.id)}
          >
            {tab === item.id && (
              <motion.span layoutId="lens-tab-indicator" className="lens-tabs__indicator" transition={{ duration: 0.26, ease: easeOutQuint }} />
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={`${node.id}-${tab}`}
        className="lens-panel"
        role="tabpanel"
        id={`lens-panel-${tab}`}
        aria-labelledby={`lens-tab-${tab}`}
        {...swapMotion}
      >
        {tab === "ask" && (
          <>
            <p className="ai-intro">
              <Sparkle size={12} weight="fill" /> Neuron answered these for {node.data.title} before you asked.
            </p>
            <ul className="ask-list">
              {asks.map((ask) => {
                const open = openAsk === ask.id;
                return (
                  <li key={ask.id} className={`ask-item ${open ? "is-open" : ""}`}>
                    <button
                      className="ask-item__q"
                      aria-expanded={open}
                      onClick={() => {
                        if (ask.opensImpact) {
                          onTabChange("impact");
                          return;
                        }
                        onOpenAsk(open ? null : ask.id);
                      }}
                    >
                      <span>{ask.question}</span>
                      {ask.opensImpact ? <Crosshair size={13} className="caret" /> : <CaretDown size={13} className="caret" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div className="disclosure" {...disclosureMotion}>
                          <div className="ask-item__a">
                            <p>{ask.answer}</p>
                            {ask.cites.length > 0 && (
                              <div className="ask-cites" aria-label="Assets this answer refers to, highlighted on the graph">
                                {ask.cites.map((id) => (
                                  <span key={id} className="mono">{titleOf(id)}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
            <p className="lens-footnote">Simulated reasoning. No model is called in this prototype.</p>
          </>
        )}

        {tab === "evidence" && (
          <>
            {handoff && (
              <section className="handoff-card">
                <div className="handoff-card__title"><ClipboardText size={13} weight="fill" /> From the handoff · {handoff.who}</div>
                <dl className="decision-record decision-record--compact">
                  <dt>What was decided</dt><dd>{handoff.decided}</dd>
                  <dt>Why</dt><dd>{handoff.why}</dd>
                  <dt>What you need to do</dt><dd className="is-next">{handoff.next}</dd>
                </dl>
                <div className="rec-card__actions">{pinButton("handoff")}</div>
              </section>
            )}
            <section className="ai-insight">
              <div className="ai-insight__title"><Brain size={15} weight="duotone" /> Neuron hypothesis</div>
              <p>{aiHypothesis.text}</p>
              <div className="confidence">
                <span>Confidence</span>
                <span className="confidence__track">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: aiHypothesis.confidence }}
                    transition={{ duration: 0.7, ease: easeOutQuint, delay: 0.1 }}
                  />
                </span>
                <b className="mono">{aiHypothesis.confidence.toFixed(2)}</b>
              </div>
              <button className={`button button--ai ${traceActive ? "is-on" : ""}`} onClick={onShowEvidence} aria-pressed={traceActive}>
                <Sparkle size={14} weight="fill" />
                {traceActive ? "Evidence is traced on the graph" : "Trace the evidence on the graph"}
              </button>
            </section>
            <p className="lens-footnote">Simulated reasoning. The confidence value is illustrative.</p>
          </>
        )}

        {tab === "impact" && impact && (
          <>
            <div className="impact-head">
              <Crosshair size={14} weight="bold" />
              If {node.data.title} failed right now
            </div>

            <div className="impact-summary">
              <div className={impact.dropped.length > 0 ? "is-drop" : ""}>
                <b className="mono">{impact.dropped.length}</b>
                <span>lose power</span>
              </div>
              <div className={impact.held.length > 0 ? "is-held" : ""}>
                <b className="mono">{impact.held.length}</b>
                <span>held by redundancy</span>
              </div>
              <div>
                <b className="mono">{impact.unaffected.length}</b>
                <span>unaffected</span>
              </div>
            </div>

            {impact.dropped.length > 0 && (
              <div className="impact-group impact-group--drop">
                <span>Loses power, nothing covers it</span>
                <ul>{impact.dropped.map((id) => <li key={id}>{titleOf(id)}</li>)}</ul>
              </div>
            )}
            {impact.held.length > 0 && (
              <div className="impact-group impact-group--held">
                <span>Stays up on the redundant path</span>
                <ul>{impact.held.map((id) => <li key={id}>{titleOf(id)}</li>)}</ul>
              </div>
            )}
            {impact.dropped.length === 0 && impact.held.length === 0 && (
              <p className="impact-empty">Nothing sits downstream of {node.data.title}.</p>
            )}

            <div className="impact-actions">
              <button className={`button button--secondary ${impactActive ? "is-on" : ""}`} aria-pressed={impactActive} onClick={() => onToggleImpact(!impactActive)}>
                {impactActive ? <EyeSlash size={14} weight="bold" /> : <Eye size={14} weight="bold" />}
                {impactActive ? "Hide from graph" : "Show on graph"}
              </button>
              {pinButton("impact")}
            </div>
            <p className="lens-footnote">Computed from the modeled topology. Select another asset to compare. Generators are not represented.</p>
          </>
        )}
      </motion.div>
    </aside>
  );
}
