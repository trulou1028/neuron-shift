/*
 * The self-guided tour for visitors who open the prototype with nobody presenting it.
 * Each step points at real interface and asks the visitor to use it. A step completes
 * when the app reaches the state it asks for, however the visitor got there.
 * "Do it for me" performs the step's action, so a visitor can also watch the tour play.
 */

export type TourSnapshot = {
  briefOpen: boolean;
  briefOpenItem: string | null;
  selectedId: string;
  tab: string;
  impactActive: boolean;
  reviewOpen: boolean;
  decisionCount: number;
  learningMode: boolean;
};

export type TourStepId = "welcome" | "open-item" | "open-graph" | "colors" | "impact" | "compare" | "decide" | "learning" | "done";

export type TourStep = {
  id: TourStepId;
  /** The first selector that matches a visible element is highlighted. */
  targets: string[];
  title: string;
  body: string;
  /** What the visitor should do. Absent on steps that only explain. */
  task?: string;
  /** Label for the button that performs the task on the visitor's behalf. */
  doLabel?: string;
  isDone?: (state: TourSnapshot) => boolean;
  /** Steps that show a result worth reading wait for Next once done, instead of moving on by themselves. */
  holdWhenDone?: boolean;
};

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    targets: [".shift-brief"],
    title: "A two-minute tour",
    body: "You are Louie, starting a night shift at a data center. Sarah Chen just handed you the site. Seven short steps show what this prototype argues.",
  },
  {
    id: "open-item",
    targets: ['[data-tour="handoff-ups-a-impedance"]'],
    title: "Read the reasoning, not only the data",
    body: "Most systems keep telemetry. This handoff keeps why a person made a call: what changed, what was decided, why, and what you need to do next.",
    task: "Open item 01.",
    doLabel: "Open it for me",
    isDone: (state) => state.briefOpenItem === "ups-a-impedance" || !state.briefOpen,
  },
  {
    id: "open-graph",
    targets: ['[data-tour="open-on-graph"]', ".shift-brief"],
    title: "Jump from the record to the asset",
    body: "The handoff links into the investigation. The view moves to UPS-A1 and traces the power path it affects.",
    task: "Select Open on graph.",
    doLabel: "Take me there",
    isDone: (state) => !state.briefOpen,
  },
  {
    id: "colors",
    targets: ['[data-tour="status-summary"]'],
    title: "Red means a human owes a decision",
    body: "Amber means equipment needs watching. Red means a person owes a decision. Rack R-42 sits at 92% of its budget and stays amber, because nobody owes a decision on it.",
  },
  {
    id: "impact",
    targets: ['[data-tour="tab-impact"]'],
    title: "Preview a failure on the graph",
    body: "If UPS-A1 failed right now, nothing would lose power. The redundant B path holds every downstream asset.",
    task: "Open the Impact tab.",
    doLabel: "Show me",
    isDone: (state) => state.tab === "impact" && state.impactActive,
    holdWhenDone: true,
  },
  {
    id: "compare",
    targets: ['.react-flow__node[data-id="pdu"]'],
    title: "Now compare a single point of failure",
    body: "PDU-05 has no twin. If it fails, both racks go dark and nothing covers them. The contrast with UPS-A1 is the point.",
    task: "Select PDU-05 on the graph.",
    doLabel: "Show me",
    isDone: (state) => state.impactActive && state.selectedId === "pdu",
    holdWhenDone: true,
  },
  {
    id: "decide",
    targets: [".decision-dialog", '[data-tour="review-decide"]', '.react-flow__node[data-id="ups-a"]'],
    title: "Friction that scales with the stakes",
    body: "Neuron recommends moving critical load off UPS-A1. That is hard to undo, so approving it takes four checks and the asset name typed back. A reversible change on SWGR-A takes one click.",
    task: "Review the UPS-A1 recommendation and record a decision.",
    doLabel: "Open it for me",
    isDone: (state) => state.decisionCount > 0,
  },
  {
    id: "learning",
    targets: ['[data-tour="learning-toggle"]'],
    title: "Scaffolding that switches off",
    body: "Your decision cleared the red and pinned itself to the canvas for the next shift. Last, the learning layer: definitions and a self-test for newcomers like me. Real operators turn it off.",
    task: "Turn on the learning layer.",
    doLabel: "Turn it on",
    isDone: (state) => state.learningMode,
  },
  {
    id: "done",
    targets: ['[data-tour="case-study"]'],
    title: "That is the idea",
    body: "The brief transfers the previous operator's judgment. The graph shows where yours is still owed. The case study covers why it is built this way and what comes next.",
  },
];

/** Welcome and done frame the tour. The count shown to the visitor covers the steps between. */
export const countedSteps = tourSteps.length - 2;
