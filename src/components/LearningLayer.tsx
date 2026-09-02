import { CaretDown, GraduationCap } from "@phosphor-icons/react";
import { glossary, learnSections, quiz, type LearnSection, type PowerNode } from "../data/scenario";

type LearningLayerProps = {
  node: PowerNode;
  openSection: LearnSection;
  onOpenSection: (section: LearnSection) => void;
  answer: string | null;
  onAnswer: (option: string) => void;
  quizOpen: boolean;
  onToggleQuiz: () => void;
};

/**
 * Deliberately separate from the operator panel above it. A real operator already
 * knows this material. This is onboarding scaffolding, so it gets its own color
 * and can be switched off entirely.
 */
export function LearningLayer({ node, openSection, onOpenSection, answer, onAnswer, quizOpen, onToggleQuiz }: LearningLayerProps) {
  const feedback = answer === null ? "" : answer === quiz.answer ? quiz.correctFeedback : quiz.incorrectFeedback;
  const terms = glossary.filter((entry) => `${node.data.title} ${node.data.definition} ${node.data.signal}`.includes(entry.term));

  return (
    <section className="learning-layer" aria-label="Learning layer">
      <div className="learning-layer__head">
        <GraduationCap size={15} weight="fill" /> Learning layer
        <span>added by me, not part of the operator tool</span>
      </div>

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

      {terms.length > 0 && (
        <dl className="glossary">
          {terms.map((entry) => (
            <div key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className={`self-test ${quizOpen ? "is-open" : ""}`}>
        <button className="self-test__toggle" aria-expanded={quizOpen} onClick={onToggleQuiz}>
          Test myself
          <CaretDown size={14} />
        </button>
        {quizOpen && (
          <div className="self-test__body">
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
            {/* Always rendered so screen readers announce the result when it changes. */}
            <div className={`answer-feedback ${answer === quiz.answer ? "is-correct" : ""}`} role="status" aria-live="polite">
              {feedback}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
