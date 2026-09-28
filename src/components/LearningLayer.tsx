import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, GraduationCap } from "@phosphor-icons/react";
import { glossary, learnSections, quiz, type LearnSection, type PowerNode } from "../data/scenario";
import { disclosureMotion, easeOutExpo, swapMotion } from "../motion";

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
  const sectionRef = useRef<HTMLElement>(null);

  // The layer appends below the operator panel, often below the fold. Bring it into view when it turns on.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      sectionRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.section
      ref={sectionRef}
      className="learning-layer"
      aria-label="Learning layer"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.34, ease: easeOutExpo } }}
      exit={{ opacity: 0, y: 16, transition: { duration: 0.16 } }}
    >
      <div className="learning-layer__head">
        <GraduationCap size={14} weight="fill" /> Learning layer
        <span>Added by me. Not part of the operator tool.</span>
      </div>

      <motion.div key={node.id} {...swapMotion}>
        {learnSections.map((section) => {
          const open = openSection === section.id;
          return (
            <div key={section.id} className={`learn-section ${open ? "is-open" : ""}`}>
              <button className="learn-section__toggle" aria-expanded={open} onClick={() => onOpenSection(section.id)}>
                {section.label}
                <CaretDown size={13} className="caret" />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div className="disclosure" {...disclosureMotion}>
                    <p>{section.read(node.data)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {terms.length > 0 && (
          <dl className="glossary">
            {terms.map((entry) => (
              <div key={entry.term}>
                <dt className="mono">{entry.term}</dt>
                <dd>{entry.meaning}</dd>
              </div>
            ))}
          </dl>
        )}
      </motion.div>

      <div className={`self-test ${quizOpen ? "is-open" : ""}`}>
        <button className="learn-section__toggle" aria-expanded={quizOpen} onClick={onToggleQuiz}>
          Test myself
          <CaretDown size={13} className="caret" />
        </button>
        <AnimatePresence initial={false}>
          {quizOpen && (
            <motion.div className="disclosure" {...disclosureMotion}>
              <div className="self-test__body">
                <p>{quiz.question}</p>
                <div className="answer-grid">
                  {quiz.options.map((option) => {
                    const picked = answer === option;
                    return (
                      <button
                        key={option}
                        aria-pressed={picked}
                        className={`${picked ? "is-picked" : ""} ${picked && option === quiz.answer ? "is-correct" : ""} ${picked && option !== quiz.answer ? "is-wrong" : ""}`}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
