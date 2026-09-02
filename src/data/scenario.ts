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
  /** Set per render. "review" means a human owes a decision here; "decided" means one was made. */
  review?: "review" | "decided";
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

export type LensTab = "ask" | "evidence" | "impact";
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
  { title: "Read the signal", detail: "Battery impedance is rising on UPS-A1.", node: "ups-a", lens: "ask", showsTrace: false },
  { title: "Trace the path", detail: "Find the upstream and downstream impact.", node: "switchgear", lens: "evidence", showsTrace: true },
  { title: "Check redundancy", detail: "Compare the healthy B path.", node: "ups-b", lens: "evidence", showsTrace: true },
  { title: "Choose an action", detail: "Protect the load before maintenance.", node: "pdu", lens: "impact", showsTrace: true },
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

/* ---------------------------------------------------------------------------
 * Impact preview. Computed from the real topology, not authored.
 * A node "drops" when removing the failed asset makes it unreachable from the
 * utility source. It is "held" when an alternate path still reaches it.
 * ------------------------------------------------------------------------- */

const rootIds = powerNodes.filter((node) => !connections.some(([, target]) => target === node.id)).map((node) => node.id);

function reachable(excluded: Set<string>): Set<string> {
  const seen = new Set<string>();
  const queue = rootIds.filter((id) => !excluded.has(id));
  queue.forEach((id) => seen.add(id));

  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const [source, target] of connections) {
      if (source === current && !excluded.has(target) && !seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return seen;
}

function downstreamOf(id: string): string[] {
  const seen = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const [source, target] of connections) {
      if (source === current && !seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return [...seen];
}

export type ImpactResult = {
  failed: string;
  /** Loses power because no alternate path remains. */
  dropped: string[];
  /** Downstream of the failure but still fed by a redundant path. */
  held: string[];
  /** Not downstream of the failure at all. */
  unaffected: string[];
};

export function computeImpact(failedId: string): ImpactResult {
  const survivors = reachable(new Set([failedId]));
  const downstream = downstreamOf(failedId);
  const dropped = downstream.filter((id) => !survivors.has(id));
  const held = downstream.filter((id) => survivors.has(id));
  const touched = new Set([failedId, ...downstream]);
  return {
    failed: failedId,
    dropped,
    held,
    unaffected: powerNodes.map((node) => node.id).filter((id) => !touched.has(id)),
  };
}

export const impactByNode = new Map<string, ImpactResult>(powerNodes.map((node) => [node.id, computeImpact(node.id)]));

export const titleOf = (id: string) => requireNode(id).data.title;

/* ---------------------------------------------------------------------------
 * Anchored questions. The AI has already answered these for each asset, so the
 * operator never has to compose a prompt. Every answer names assets on the graph.
 * ------------------------------------------------------------------------- */

export type AskItem = {
  id: string;
  question: string;
  answer: string;
  /** Node ids the answer refers to. Highlighted on the graph while the answer is open. */
  cites: string[];
  /** Runs the impact preview instead of returning prose. */
  opensImpact?: boolean;
};

const authoredAsks: Record<string, { question: string; answer: string; cites: string[] }[]> = {
  utility: [
    { question: "Is the incoming supply stable?", answer: "Voltage and frequency have held within tolerance for the last 14 hours. No sags recorded during this shift.", cites: ["utility"] },
    { question: "What carries the load if this drops?", answer: "The two UPS paths carry the critical load for minutes, then generators are expected to pick up. Generator status is not modeled in this prototype.", cites: ["ups-a", "ups-b"] },
  ],
  transformer: [
    { question: "Is this transformer stressed?", answer: "Loading is near 61% of the 2.5 MVA rating and winding temperature sits well below the alarm point.", cites: ["transformer"] },
    { question: "Would it cope if load shifted to the B path?", answer: "Yes. Both UPS paths already sit behind this transformer, so a shift between them does not change its total load.", cites: ["transformer", "ups-a", "ups-b"] },
  ],
  switchgear: [
    { question: "Why is breaker loading at 88%?", answer: "Loading rose from 81% to 88% after two racks were added in row B this afternoon. It remains within the breaker rating and thermal readings are normal.", cites: ["switchgear", "rack-42"] },
    { question: "Can I rebalance the load tonight?", answer: "Not recommended. Sarah Chen held this at 17:55 because a load shift would reduce B-path margin while UPS-A1 is under observation.", cites: ["switchgear", "ups-b", "ups-a"] },
  ],
  "ups-a": [
    { question: "Why is estimated runtime falling?", answer: "Battery string impedance rose through the afternoon. Neuron attributes this to a cell-level fault in the string rather than a charger or load problem, at 0.82 confidence.", cites: ["ups-a"] },
    { question: "Is the critical load still protected?", answer: "Yes. UPS-B1 is synchronised and holds 12.8 minutes of runtime on the redundant path serving the same PDU.", cites: ["ups-b", "pdu"] },
    { question: "When does this become urgent?", answer: "Below 6.0 minutes of estimated runtime, or if UPS-B1 capacity falls. A battery-string inspection is already scheduled for 22:00.", cites: ["ups-a", "ups-b"] },
  ],
  "ups-b": [
    { question: "Can the B path carry the load alone?", answer: "Yes, at 12.8 minutes of runtime against the 371 kW the PDU is drawing. This assumption should be confirmed against the site load study.", cites: ["ups-b", "pdu"] },
    { question: "Is B affected by the same fault as A?", answer: "No. Impedance on the B string is flat and it sits in a separate battery cabinet on a separate branch from the switchgear.", cites: ["ups-b", "switchgear"] },
  ],
  pdu: [
    { question: "Is there capacity headroom here?", answer: "371 kW at 72% utilised leaves roughly 144 kW of headroom, and phase balance is within tolerance.", cites: ["pdu"] },
    { question: "Which racks does this feed?", answer: "Racks R-42 and R-43. R-42 is the closer one to watch at 92% of its power budget.", cites: ["rack-42", "rack-43"] },
  ],
  "rack-42": [
    { question: "Why is this rack near its budget?", answer: "Draw rose after the row B additions this afternoon and now sits at 92% of the rack budget.", cites: ["rack-42", "switchgear"] },
    { question: "Does it have both feeds?", answer: "Yes, an A and a B feed. The A feed traces back through UPS-A1, which is the asset under observation this shift.", cites: ["rack-42", "ups-a"] },
  ],
  "rack-43": [
    { question: "Is this related to the R-42 trend?", answer: "No. R-43 sits at 61% of budget with a flat draw, which suggests the rise on R-42 is local to that rack.", cites: ["rack-43", "rack-42"] },
    { question: "What was the thermal advisory here?", answer: "An inlet temperature advisory cleared at 18:30. It was a sensor calibration issue, not an equipment failure.", cites: ["rack-43"] },
  ],
};

export function asksForNode(id: string): AskItem[] {
  const authored = (authoredAsks[id] ?? []).map((ask, index) => ({ id: `${id}-a${index}`, ...ask }));
  const downstream = downstreamOf(id);
  const impact = impactByNode.get(id);

  const dependsAnswer =
    downstream.length === 0
      ? "Nothing sits downstream of this asset. It is at the end of the modeled path."
      : `${downstream.length} assets sit downstream: ${downstream.map(titleOf).join(", ")}.`;

  return [
    ...authored,
    { id: `${id}-depends`, question: "What depends on this?", answer: dependsAnswer, cites: downstream },
    {
      id: `${id}-impact`,
      question: "What happens if it fails right now?",
      answer: impact && impact.dropped.length === 0
        ? "No load drops. Every downstream asset keeps power through a redundant path."
        : `${impact?.dropped.length ?? 0} assets would lose power.`,
      cites: [],
      opensImpact: true,
    },
  ];
}

/* ---------------------------------------------------------------------------
 * Learning layer. Scaffolding for someone new to the domain, kept deliberately
 * separate from the operator tool. Real operators already know all of this.
 * ------------------------------------------------------------------------- */

export const glossary: { term: string; meaning: string }[] = [
  { term: "UPS", meaning: "Uninterruptible power supply. A battery system that carries the load through short outages." },
  { term: "PDU", meaning: "Power distribution unit. Splits conditioned power into branch circuits serving racks." },
  { term: "Switchgear", meaning: "Breakers and protection controls that route power and isolate faults." },
  { term: "N+1", meaning: "One more unit than the load requires, so a single failure does not interrupt service." },
  { term: "PUE", meaning: "Power usage effectiveness. Total facility power divided by IT power. Closer to 1.0 is more efficient." },
  { term: "MVA", meaning: "Megavolt-ampere. The apparent power a transformer is rated to carry." },
  { term: "Impedance", meaning: "Resistance to current in a battery string. Rising impedance signals ageing cells." },
];
