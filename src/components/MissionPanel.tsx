import { Check, GraduationCap, Info, Lightning, ShieldCheck, Warning } from "@phosphor-icons/react";
import { learningSteps, telemetryBaseline } from "../data/scenario";

type MissionPanelProps = {
  activeStep: number;
  traceActive: boolean;
  honestyOpen: boolean;
  onToggleHonesty: () => void;
  onToggleTrace: () => void;
  onGoToStep: (index: number) => void;
};

export function MissionPanel({ activeStep, traceActive, honestyOpen, onToggleHonesty, onToggleTrace, onGoToStep }: MissionPanelProps) {
  const currentStep = learningSteps[activeStep];

  return (
    <aside className="mission-panel">
      <div className="panel-kicker-row">
        <div className="panel-kicker"><GraduationCap size={16} weight="fill" /> Operator learning mode</div>
        <button
          className={`info-button ${honestyOpen ? "is-open" : ""}`}
          aria-expanded={honestyOpen}
          aria-controls="honesty-note"
          aria-label="About the data in this prototype"
          title="How the data in this prototype is labeled"
          onClick={onToggleHonesty}
        >
          <Info size={16} />
        </button>
      </div>
      {honestyOpen && (
        <div className="assumption-note" id="honesty-note">
          <ShieldCheck size={16} />
          <span>
            <strong>Learning honestly</strong>
            Values are simulated. Industry assumptions are labeled in the Learning Lens so an expert can correct them.
          </span>
        </div>
      )}
      <h1>Follow the power.<br />Understand the risk.</h1>

      <div className="incident-card">
        <div className="incident-card__title"><Warning size={15} weight="fill" /> Active scenario</div>
        <strong>UPS-A1 battery impedance rising</strong>
        <p>Estimated runtime fell from {telemetryBaseline.previousRuntimeMin} to {telemetryBaseline.upsRuntimeMin} minutes.</p>
        <span>Major · Power · open 16.7 h</span>
      </div>

      <button className="trace-button" aria-pressed={traceActive} onClick={onToggleTrace}>
        <Lightning size={17} weight="fill" />
        {traceActive ? "Hide affected power path" : "Trace affected power path"}
      </button>

      <div className="step-progress">
        <div className="step-progress__meta">
          <span>Guided investigation</span>
          <span>Step {activeStep + 1} of {learningSteps.length}</span>
        </div>
        <div
          className="step-progress__track"
          style={{ gridTemplateColumns: `repeat(${learningSteps.length}, 1fr)` }}
          aria-hidden="true"
        >
          {learningSteps.map((step, index) => (
            <span key={step.title} className={index <= activeStep ? "is-filled" : ""} />
          ))}
        </div>
      </div>

      <div className="current-step">
        <span className="current-step__index">{activeStep + 1}</span>
        <div>
          <strong>{currentStep.title}</strong>
          <p>{currentStep.detail}</p>
        </div>
      </div>

      <ol className="step-list">
        {learningSteps.map((step, index) => (
          <li key={step.title}>
            <button
              className={`step-item ${index === activeStep ? "is-active" : ""} ${index < activeStep ? "is-complete" : ""}`}
              aria-current={index === activeStep ? "step" : undefined}
              onClick={() => onGoToStep(index)}
            >
              <span className="step-item__index">{index < activeStep ? <Check size={11} weight="bold" /> : index + 1}</span>
              <span>{step.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
