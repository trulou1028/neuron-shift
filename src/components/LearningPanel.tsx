import type { KeyboardEvent } from "react";
import { BookOpenText, Brain, CaretDown, CircleNotch, ClipboardText, GraduationCap, Sparkle } from "@phosphor-icons/react";
import {
  aiHypothesis,
  handoffByNode,
  learnSections,
  lensTabs,
  quiz,
  type LearnSection,
  type LensTab,
  type PowerNode,
} from "../data/scenario";

type LearningPanelProps = {
  node: PowerNode;
  tab: LensTab;
  onTabChange: (tab: LensTab) => void;
  openSection: LearnSection;
  onOpenSection: (section: LearnSection) => void;
  traceActive: boolean;
  onShowEvidence: () => void;
  answer: string | null;
  onAnswer: (option: string) => void;
};

export function LearningPanel({
  node,
  tab,
  onTabChange,
  openSection,
  onOpenSection,
  traceActive,
  onShowEvidence,
  answer,
  onAnswer,
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

  const feedback = answer === null ? "" : answer === quiz.answer ? quiz.correctFeedback : quiz.incorrectFeedback;
  const handoff = handoffByNode.get(node.id);

  return (
    <aside className="learning-panel">
      <div className="learning-panel__top">
        <div className="panel-kicker"><BookOpenText size={16} weight="fill" /> Learning lens</div>
        <span className={`asset-status asset-status--${node.data.status}`}>{node.data.status}</span>
      </div>
      <span className="selected-eyebrow">{node.data.eyebrow}</span>
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

      <div className="lens-tabs" role="tablist" aria-label="Learning lens sections" onKeyDown={handleTabKeyDown}>
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

      {tab === "learn" && (
        <div className="lens-panel" role="tabpanel" id="lens-panel-learn" aria-labelledby="lens-tab-learn">
          {learnSections.map((section) => {
            const open = openSection === section.id;
            return (
              <div key={section.id} className={`learn-section ${open ? "is-open" : ""}`}>
                <button className="learn-section__toggle" aria-expanded={open} onClick={() => onOpenSection(section.id)}>
                  {section.label}
                  <CaretDown size={14} />
                </button>
                {open && <p>{section.read(node.data)}</p>}
              </div>
            );
          })}
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

      {tab === "check" && (
        <div className="lens-panel" role="tabpanel" id="lens-panel-check" aria-labelledby="lens-tab-check">
          <div className="knowledge-check">
            <div className="knowledge-check__title"><GraduationCap size={17} /> Quick check</div>
            <p>{quiz.question}</p>
            <div className="answer-grid">
              {quiz.options.map((option) => {
                const picked = answer === option;
                return (
                  <button
                    key={option}
                    aria-pressed={picked}
                    className={`${picked ? "is-picked" : ""} ${picked && option === quiz.answer ? "is-correct" : ""}`}
                    onClick={() => onAnswer(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {/* Always rendered so screen readers announce the feedback when it changes. */}
            <div className={`answer-feedback ${answer === quiz.answer ? "is-correct" : ""}`} role="status" aria-live="polite">
              {feedback}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
