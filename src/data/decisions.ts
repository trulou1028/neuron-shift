import { shiftHandoff } from "./scenario";

/* Every recommendation, threshold, and procedure below is fictional. */

/** What Neuron is allowed to do on its own, and what it must never touch. */
export type ActionTier = "auto" | "approval" | "never";

export const tierLabel: Record<ActionTier, string> = {
  auto: "Neuron does this alone",
  approval: "Needs your approval",
  never: "Neuron never does this",
};

export type AutonomyItem = { tier: ActionTier; label: string };

/** Drives how much friction the approval gate imposes. */
export type Reversibility = "reversible" | "consequential";

export type Recommendation = {
  id: string;
  node: string;
  headline: string;
  rationale: string;
  confidence: number;
  reversibility: Reversibility;
  /** The method of procedure. On a consequential action these become pre-flight acknowledgements. */
  steps: string[];
  autonomy: AutonomyItem[];
  deferTriggers: string[];
  modifyOptions: string[];
};

export const recommendations: Recommendation[] = [
  {
    id: "rec-ups-a-transfer",
    node: "ups-a",
    headline: "Transfer critical load to the B path before the 22:00 inspection",
    rationale:
      "UPS-A1 runtime is 7.4 minutes and falling. Moving the load to UPS-B1 takes the degraded battery string out of the critical path before technicians open the cabinet.",
    confidence: 0.78,
    reversibility: "consequential",
    steps: [
      "UPS-B1 is synchronized and in normal mode",
      "PDU-05 phase balance is within tolerance",
      "Rack R-42 and R-43 both show healthy A and B feeds",
      "The 22:00 procedure is approved and a technician is assigned",
    ],
    autonomy: [
      { tier: "auto", label: "Pull impedance and runtime trends for both paths" },
      { tier: "auto", label: "Run the pre-transfer readiness check" },
      { tier: "approval", label: "Raise the UPS-A1 alarm threshold for the maintenance window" },
      { tier: "never", label: "Initiate the load transfer" },
      { tier: "never", label: "Place UPS-A1 into bypass" },
    ],
    deferTriggers: [
      "Runtime falls below 6.0 minutes",
      "UPS-B1 available runtime drops below 10.0 minutes",
      "Neuron confidence moves by more than 0.10",
    ],
    modifyOptions: [
      "Transfer after the 22:00 window rather than before",
      "Transfer the R-42 feed only and hold R-43",
    ],
  },
  {
    id: "rec-swgr-threshold",
    node: "switchgear",
    headline: "Raise the SWGR-A loading alert to 92% until 07:00",
    rationale:
      "Loading sits at 88% after the row B additions and is stable. The current 85% alert is firing repeatedly without a new condition behind it.",
    confidence: 0.86,
    reversibility: "reversible",
    steps: ["Set the SWGR-A breaker loading alert to 92% until 07:00"],
    autonomy: [
      { tier: "auto", label: "Summarize how often the alert has fired this shift" },
      { tier: "approval", label: "Change the alert threshold" },
      { tier: "never", label: "Operate a breaker" },
      { tier: "never", label: "Rebalance load across the switchboard" },
    ],
    deferTriggers: ["Loading exceeds 92%", "A second circuit is added to row B"],
    modifyOptions: ["Raise to 90% instead of 92%", "Apply until 23:00 rather than 07:00"],
  },
];

export const recommendationByNode = new Map<string, Recommendation>(
  recommendations.map((item) => [item.node, item]),
);

export type DecisionKind = "approved" | "modified" | "deferred" | "rejected";

export const decisionLabel: Record<DecisionKind, string> = {
  approved: "Approved",
  modified: "Approved with changes",
  deferred: "Deferred",
  rejected: "Rejected",
};

export type OperatorDecision = {
  recommendationId: string;
  node: string;
  headline: string;
  kind: DecisionKind;
  /** The chosen trigger, modification, or an empty string for a plain approval. */
  detail: string;
  /** Why the operator disagreed. Captured on anything other than a plain approval. */
  reason: string;
  at: string;
};

/** Reasons an operator overrides the model. The most valuable signal in the system. */
export const overrideReasons = [
  "Redundancy makes this less urgent than the model assumes",
  "The model is missing context about planned work",
  "Timing conflicts with another procedure",
  "I do not trust the underlying telemetry yet",
];

export function simulatedNow(minutesSinceHandoff: number): string {
  const [hours, minutes] = shiftHandoff.handoffTime.split(":").map(Number);
  const total = hours * 60 + minutes + minutesSinceHandoff;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
