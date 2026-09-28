import { AnimatePresence, motion } from "motion/react";
import { Check, Info, Lightning, ShieldCheck, Warning } from "@phosphor-icons/react";
import { learningSteps, telemetryBaseline } from "../data/scenario";
import { disclosureMotion } from "../motion";

type MissionPanelProps = {
  activeStep: number;
  traceActive: boolean;
  honestyOpen: boolean;
  onToggleHonesty: () => void;
  onToggleTrace: () => void;
  onGoToStep: (index: number) => void;
};

export function MissionPanel({ activeStep, traceActive, honestyOpen, onToggleHonesty, onToggleTrace, onGoToStep }: MissionPanelProps) {
  return (
    <aside className="mission-panel" aria-label="Investigation">
      <div className="panel-kicker-row">
        <span className="panel-kicker">Investigation</span>
        <button
          className={`icon-button icon-button--small ${honestyOpen ? "is-open" : ""}`}
          aria-expanded={honestyOpen}
          aria-controls="honesty-note"
          aria-label="About the data in this prototype"
          title="How the data in this prototype is labeled"
          onClick={onToggleHonesty}
        >
          <Info size={15} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {honestyOpen && (
          <motion.div className="disclosure" {...disclosureMotion}>
            <div className="assumption-note" id="honesty-note">
              <ShieldCheck size={15} />
              <span>
                <strong>Learning honestly</strong>
                An independent concept prototype, not affiliated with or endorsed by any company. Every value is
                simulated, and industry assumptions are labeled so an expert can correct them.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <h1>Follow the power. Understand the risk.</h1>

      <section className="incident-card" aria-label="Active scenario">
        <div className="incident-card__title"><Warning size={13} weight="fill" /> Active scenario</div>
        <strong>UPS-A1 battery impedance rising</strong>
        <p>
          Estimated runtime fell from <span className="mono">{telemetryBaseline.previousRuntimeMin}</span> to{" "}
          <span className="mono">{telemetryBaseline.upsRuntimeMin}</span> minutes.
        </p>
        <dl className="incident-card__facts">
          <div><dt>Severity</dt><dd>Major</dd></div>
          <div><dt>System</dt><dd>Power</dd></div>
          <div><dt>Open</dt><dd className="mono">16.7 h</dd></div>
        </dl>
      </section>

      <button className={`button button--trace ${traceActive ? "is-on" : ""}`} aria-pressed={traceActive} onClick={onToggleTrace}>
        <Lightning size={15} weight="fill" />
        {traceActive ? "Hide affected power path" : "Trace affected power path"}
      </button>

      <section className="steps" aria-label="Guided investigation">
        <div className="steps__meta">
          <span>Guided investigation</span>
          <span className="mono">{activeStep + 1}/{learningSteps.length}</span>
        </div>
        <ol className="step-list">
          {learningSteps.map((step, index) => {
            const active = index === activeStep;
            return (
              <li key={step.title} className={`step-item ${active ? "is-active" : ""} ${index < activeStep ? "is-complete" : ""}`}>
                <button aria-current={active ? "step" : undefined} onClick={() => onGoToStep(index)}>
                  <span className="step-item__index mono">{index < activeStep ? <Check size={10} weight="bold" /> : index + 1}</span>
                  <span className="step-item__title">{step.title}</span>
                </button>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div className="disclosure" {...disclosureMotion}>
                      <p className="step-item__detail">{step.detail}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </section>
    </aside>
  );
}
