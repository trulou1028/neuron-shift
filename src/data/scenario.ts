import type { Node } from "@xyflow/react";

export type NodeStatus = "healthy" | "warning";

export type PowerNodeData = {
  title: string;
  eyebrow: string;
  metric: string;
  metricLabel: string;
  status: NodeStatus;
  definition: string;
  whyItMatters: string;
  signal: string;
  assumption?: boolean;
};

export type PowerNode = Node<PowerNodeData, "power">;

export const powerNodes: PowerNode[] = [
  {
    id: "utility",
    type: "power",
    position: { x: 0, y: 190 },
    data: {
      eyebrow: "Source",
      title: "Utility feed A",
      metric: "13.8 kV",
      metricLabel: "incoming voltage",
      status: "healthy",
      definition: "The external electrical supply entering the data center from the utility grid.",
      whyItMatters: "Every downstream system depends on a stable incoming source before backup systems are needed.",
      signal: "Voltage stability, frequency, breaker state",
    },
  },
  {
    id: "transformer",
    type: "power",
    position: { x: 196, y: 190 },
    data: {
      eyebrow: "Step-down",
      title: "Transformer T-01",
      metric: "2.5 MVA",
      metricLabel: "13.8 kV → 480 V",
      status: "healthy",
      definition: "A transformer converts high utility voltage into a lower voltage usable by facility equipment.",
      whyItMatters: "Heat, load, and winding conditions can reveal stress before a failure reaches downstream systems.",
      signal: "Load ratio, winding temperature, dissolved gas",
    },
  },
  {
    id: "switchgear",
    type: "power",
    position: { x: 392, y: 190 },
    data: {
      eyebrow: "Distribution",
      title: "Switchgear SWGR-A",
      metric: "88%",
      metricLabel: "breaker loading",
      status: "warning",
      definition: "Switchgear combines breakers, disconnects, and protection controls that route and isolate electrical power.",
      whyItMatters: "Operators use it to safely isolate faults without taking an entire facility offline.",
      signal: "Breaker position, current imbalance, trip events",
      assumption: true,
    },
  },
  {
    id: "ups-a",
    type: "power",
    position: { x: 588, y: 60 },
    data: {
      eyebrow: "Backup path A",
      title: "UPS-A1",
      metric: "7.4 min",
      metricLabel: "estimated runtime",
      status: "warning",
      definition: "An uninterruptible power supply bridges short outages and conditions power before it reaches IT equipment.",
      whyItMatters: "Its batteries must carry the critical load until generators start or utility power returns.",
      signal: "Battery impedance, runtime, bypass state",
      assumption: true,
    },
  },
  {
    id: "ups-b",
    type: "power",
    position: { x: 588, y: 320 },
    data: {
      eyebrow: "Backup path B",
      title: "UPS-B1",
      metric: "12.8 min",
      metricLabel: "estimated runtime",
      status: "healthy",
      definition: "The redundant UPS path can support the same critical load if the primary path is unavailable.",
      whyItMatters: "A/B redundancy reduces the chance that one component failure interrupts servers.",
      signal: "Available capacity, synchronization, transfer state",
      assumption: true,
    },
  },
  {
    id: "pdu",
    type: "power",
    position: { x: 784, y: 190 },
    data: {
      eyebrow: "Room distribution",
      title: "PDU-05",
      metric: "371 kW",
      metricLabel: "72% utilized",
      status: "healthy",
      definition: "A power distribution unit divides conditioned power into smaller circuits serving racks or rows.",
      whyItMatters: "Operators watch capacity and phase balance to prevent local overloads near the IT load.",
      signal: "kW, phase balance, branch-circuit current",
    },
  },
  {
    id: "rack-42",
    type: "power",
    position: { x: 980, y: 110 },
    data: {
      eyebrow: "IT load",
      title: "Rack R-42",
      metric: "18.6 kW",
      metricLabel: "92% of budget",
      status: "warning",
      definition: "A rack contains servers and network equipment supplied by one or more power paths.",
      whyItMatters: "Rack-level consumption is where facility capacity becomes usable compute.",
      signal: "Real power, inlet temperature, A/B feed balance",
    },
  },
  {
    id: "rack-43",
    type: "power",
    position: { x: 980, y: 270 },
    data: {
      eyebrow: "IT load",
      title: "Rack R-43",
      metric: "12.3 kW",
      metricLabel: "61% of budget",
      status: "healthy",
      definition: "A neighboring rack helps reveal whether an issue is isolated or affecting a wider branch circuit.",
      whyItMatters: "Comparing peers can separate a local equipment problem from an upstream power event.",
      signal: "Load trend, feed balance, peer deviation",
    },
  },
];

export const connections: [string, string][] = [
  ["utility", "transformer"],
  ["transformer", "switchgear"],
  ["switchgear", "ups-a"],
  ["switchgear", "ups-b"],
  ["ups-a", "pdu"],
  ["ups-b", "pdu"],
  ["pdu", "rack-42"],
  ["pdu", "rack-43"],
];

export const affectedPath = new Set(["utility-transformer", "transformer-switchgear", "switchgear-ups-a", "ups-a-pdu", "pdu-rack-42"]);

export const DEFAULT_SELECTED_ID = "ups-a";

export function requireNode(id: string): PowerNode {
  const node = powerNodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Node "${id}" is missing from powerNodes`);
  return node;
}

export const defaultNode = requireNode(DEFAULT_SELECTED_ID);

export const statusCounts = powerNodes.reduce<Record<NodeStatus, number>>(
  (counts, node) => ({ ...counts, [node.data.status]: counts[node.data.status] + 1 }),
  { healthy: 0, warning: 0 },
);

export type LensTab = "learn" | "evidence" | "check";
export type LearnSection = "what" | "why" | "signals";

export type LearningStep = {
  title: string;
  detail: string;
  node: string;
  lens: LensTab;
  /** Steps that need the affected path visible turn the trace on. No step turns it off. */
  showsTrace: boolean;
};

export const learningSteps: LearningStep[] = [
  { title: "Read the signal", detail: "Battery impedance is rising on UPS-A1.", node: "ups-a", lens: "learn", showsTrace: false },
  { title: "Trace the path", detail: "Find the upstream and downstream impact.", node: "switchgear", lens: "evidence", showsTrace: true },
  { title: "Check redundancy", detail: "Compare the healthy B path.", node: "ups-b", lens: "evidence", showsTrace: true },
  { title: "Choose an action", detail: "Protect the load before maintenance.", node: "pdu", lens: "check", showsTrace: true },
];

export const lensTabs: { id: LensTab; label: string }[] = [
  { id: "learn", label: "Learn" },
  { id: "evidence", label: "Evidence" },
  { id: "check", label: "Check" },
];

export const learnSections: { id: LearnSection; label: string; read: (data: PowerNodeData) => string }[] = [
  { id: "what", label: "What it is", read: (data) => data.definition },
  { id: "why", label: "Why an operator cares", read: (data) => data.whyItMatters },
  { id: "signals", label: "Signals to watch", read: (data) => data.signal },
];

export const aiHypothesis = {
  text: "UPS-A1 degradation appears isolated to the battery string. The redundant B path remains within normal operating range.",
  confidence: 0.82,
};

export const quiz = {
  question: "Which component bridges a short utility outage before generators take over?",
  options: ["Switchgear", "UPS", "PDU"],
  answer: "UPS",
  correctFeedback: "Correct. The UPS carries the load during the transition.",
  incorrectFeedback: "Not quite. Trace the path and inspect the backup layer.",
};

/** Mock telemetry baseline. UPS-A runtime anchors the learning scenario and never drifts. */
export const telemetryBaseline = { siteLoadMw: 78.2, pue: 1.21, upsRuntimeMin: 7.4, previousRuntimeMin: 10.2 };

/* Shift handoff. Every threshold, time, and name below is fictional. */

export type ChangeKind = "new" | "changed" | "resolved" | "unchanged";

export type HandoffItem = {
  id: string;
  title: string;
  status: "attention" | "resolved";
  node: string;
  showsTrace: boolean;
  changed: string;
  known: string;
  decided: string;
  why: string;
  who: string;
  next: string;
};

export const shiftHandoff = {
  site: "Ashburn 88",
  handoffTime: "19:00",
  changesSince: "19:02",
  outgoing: "Sarah Chen",
  incoming: "Louie",
  /** Simulated minutes between the handoff and the moment the app loads. */
  minutesAgoAtLoad: 12,
  facilityStatus: "Watch",
  redundancy: "N+1 redundancy intact",
  items: [
    {
      id: "ups-a-impedance",
      title: "UPS-A1 battery impedance remains under observation",
      status: "attention",
      node: "ups-a",
      showsTrace: true,
      changed: "Battery impedance rose through the afternoon. Estimated runtime fell from 10.2 to 7.4 minutes.",
      known: "No upstream power anomaly. The redundant B path is healthy at 12.8 minutes of runtime.",
      decided: "Continue monitoring. Defer battery-string inspection to the 22:00 maintenance window.",
      why: "Redundancy is intact and runtime is above the 6.0 minute intervention threshold.",
      who: "Sarah Chen · 16:42",
      next: "Reassess if runtime falls below 6.0 minutes or Neuron confidence changes materially.",
    },
    {
      id: "swgr-a-loading",
      title: "Switchgear SWGR-A breaker loading at 88%",
      status: "attention",
      node: "switchgear",
      showsTrace: false,
      changed: "Loading rose from 81% to 88% after two racks were added in row B.",
      known: "Within breaker rating. Thermal readings normal.",
      decided: "Hold. Do not rebalance load tonight.",
      why: "A load shift would reduce B-path margin while UPS-A1 is under observation.",
      who: "Sarah Chen · 17:55",
      next: "Escalate if loading exceeds 92%. Do not rebalance while UPS-A1 is under observation.",
    },
    {
      id: "rack-43-thermal",
      title: "Rack R-43 thermal advisory resolved",
      status: "resolved",
      node: "rack-43",
      showsTrace: false,
      changed: "Inlet temperature advisory cleared at 18:30.",
      known: "Sensor calibration issue. No equipment failure.",
      decided: "Closed. Resolution added to the facility knowledge base.",
      why: "Recalibrated reading matched the neighboring rack within 0.3 °C.",
      who: "Sarah Chen · 18:30",
      next: "Nothing. Listed so you know it was investigated.",
    },
  ] satisfies HandoffItem[],
  changes: [
    { kind: "new", label: "UPS-A1 battery-string inspection scheduled for 22:00", detail: "Approved procedure. Technician assigned. Expect about 45 minutes of reduced redundancy." },
    { kind: "changed", label: "Neuron confidence on the UPS-A1 hypothesis", detail: "0.71 → 0.82 after new impedance telemetry arrived." },
    { kind: "resolved", label: "Rack R-43 thermal advisory", detail: "Sensor calibration. No equipment failure." },
    { kind: "unchanged", label: "Facility redundancy", detail: "Remains N+1." },
  ] satisfies { kind: ChangeKind; label: string; detail: string }[],
};

export const handoffByNode = new Map<string, HandoffItem>(shiftHandoff.items.map((item) => [item.node, item]));
