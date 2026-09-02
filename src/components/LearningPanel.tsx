import type { KeyboardEvent } from "react";
import { Brain, CaretDown, CircleNotch, ClipboardText, Crosshair, Lightning, Sparkle, Stack } from "@phosphor-icons/react";
import {
  aiHypothesis,
  asksForNode,
  handoffByNode,
  impactByNode,
  titleOf,
  type LensTab,
  type PowerNode,
} from "../data/scenario";

const lensTabs: { id: LensTab; label: string }[] = [
  { id: "ask", label: "Ask" },
  { id: "evidence", label: "Evidence" },
  { id: "impact", label: "Impact" },
];

type LearningPanelProps = {
  node: PowerNode;
  tab: LensTab;
  onTabChange: (tab: LensTab) => void;
  openAsk: string | null;
  onOpenAsk: (id: string | null) => void;
  traceActive: boolean;
  onShowEvidence: () => void;
  impactActive: boolean;
  onToggleImpact: (next: boolean) => void;
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
}: LearningPanelProps) {
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

  return (
    <aside className="learning-panel">
      <div className="learning-panel__top">
        <span className="selected-eyebrow">{node.data.eyebrow}</span>
        <span className={`asset-status asset-status--${node.data.status}`}>{node.data.status}</span>
      </div>
      <h2>{node.data.title}</h2>
      <div className="selected-reading">
        <strong>{node.data.metric}</strong>
        <span>{node.data.metricLabel}</span>
      </div>

      {node.data.assumption && (
        <div className="assumption-chip"><CircleNotch size={13} /> Domain assumption to validate</div>
      )}
      {handoff && tab !== "evidence" && (
        <button className="handoff-chip" onClick={() => onTabChange("evidence")}>
          <ClipboardText size={13} weight="fill" /> Handoff decision on record · {handoff.who}
        </button>
      )}

      <div className="lens-tabs" role="tablist" aria-label="Asset panel sections" onKeyDown={handleTabKeyDown}>
        {lensTabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`lens-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`lens-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => onTabChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "ask" && (
        <div className="lens-panel" role="tabpanel" id="lens-panel-ask" aria-labelledby="lens-tab-ask">
          <p className="ask-intro">
            <Sparkle size={13} weight="fill" /> Neuron answered these for {node.data.title} before you asked.
          </p>
          {asks.map((ask) => {
            const open = openAsk === ask.id;
            return (
              <div key={ask.id} className={`ask-item ${open ? "is-open" : ""}`}>
                <button
                  className="ask-item__q"
                  aria-expanded={open}
                  onClick={() => {
                    onOpenAsk(open ? null : ask.id);
                    if (!open && ask.opensImpact) {
                      onTabChange("impact");
                      onToggleImpact(true);
                    }
                  }}
                >
                  <span>{ask.question}</span>
                  <CaretDown size={13} />
                </button>
                {open && (
                  <div className="ask-item__a">
                    <p>{ask.answer}</p>
                    {ask.cites.length > 0 && (
                      <div className="ask-cites">
                        {ask.cites.map((id) => (
                          <span key={id}>{titleOf(id)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <p className="lens-footnote">Simulated reasoning. No model is called in this prototype.</p>
        </div>
      )}

      {tab === "evidence" && (
        <div className="lens-panel" role="tabpanel" id="lens-panel-evidence" aria-labelledby="lens-tab-evidence">
          {handoff && (
            <div className="handoff-card">
              <div className="handoff-card__title"><ClipboardText size={15} weight="fill" /> From handoff · {handoff.who}</div>
              <dl className="decision-record decision-record--compact">
                <dt>What was decided</dt><dd>{handoff.decided}</dd>
                <dt>Why</dt><dd>{handoff.why}</dd>
                <dt>What you need to do</dt><dd className="is-next">{handoff.next}</dd>
              </dl>
            </div>
          )}
          <div className="ai-insight">
            <div className="ai-insight__title"><Brain size={18} weight="duotone" /> Neuron AI hypothesis</div>
            <p>{aiHypothesis.text}</p>
            <div className="confidence">
              <span>Confidence</span>
              <span className="confidence__track"><span style={{ width: `${aiHypothesis.confidence * 100}%` }} /></span>
              <b>{aiHypothesis.confidence.toFixed(2)}</b>
            </div>
            <button onClick={onShowEvidence}>
              <Sparkle size={15} weight="fill" />
              {traceActive ? "Evidence is highlighted on the graph" : "Show evidence on graph"}
            </button>
          </div>
          <p className="lens-footnote">Simulated reasoning. The confidence value is illustrative.</p>
        </div>
      )}

      {tab === "impact" && impact && (
        <div className="lens-panel" role="tabpanel" id="lens-panel-impact" aria-labelledby="lens-tab-impact">
          <div className="impact-head">
            <Crosshair size={15} weight="bold" />
            If {node.data.title} failed right now
          </div>

          <div className="impact-summary">
            <div className={impact.dropped.length > 0 ? "is-drop" : ""}>
              <b>{impact.dropped.length}</b>
              <span>lose power</span>
            </div>
            <div className={impact.held.length > 0 ? "is-held" : ""}>
              <b>{impact.held.length}</b>
              <span>held by redundancy</span>
            </div>
            <div>
              <b>{impact.unaffected.length}</b>
              <span>unaffected</span>
            </div>
          </div>

          {impact.dropped.length > 0 && (
            <div className="impact-group impact-group--drop">
              <span>Loses power</span>
              <ul>{impact.dropped.map((id) => <li key={id}>{titleOf(id)}</li>)}</ul>
            </div>
          )}
          {impact.held.length > 0 && (
            <div className="impact-group impact-group--held">
              <span>Stays up on the redundant path</span>
              <ul>{impact.held.map((id) => <li key={id}>{titleOf(id)}</li>)}</ul>
            </div>
          )}

          <button className={`impact-toggle ${impactActive ? "is-on" : ""}`} aria-pressed={impactActive} onClick={() => onToggleImpact(!impactActive)}>
            {impactActive ? <Stack size={15} weight="fill" /> : <Lightning size={15} weight="fill" />}
            {impactActive ? "Clear impact from graph" : "Show impact on graph"}
          </button>
          <p className="lens-footnote">Computed from the modeled topology. Generators are not represented.</p>
        </div>
      )}
    </aside>
  );
}
