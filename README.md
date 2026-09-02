# Neuron Field Notes

An exploratory React Flow prototype with two connected ideas: a shift handoff that transfers the previous operator's decisions and reasoning, and a learning layer that teaches the power path while an operator investigates a signal.

## The product idea

Neuron already holds telemetry, topology, incidents, procedures, and operator decisions. This prototype asks how that intelligence should transfer between people.

- **Neuron Shift.** At the start of a shift, the incoming operator receives a structured handoff: what changed, what is known, what was decided, why, who decided, and what they need to do. Most systems preserve data. This preserves why a human made a decision.
- **Learning Lens.** Operators and new team members should not have to leave the live digital twin to understand unfamiliar systems. Contextual definitions, operational significance, signals to watch, and a small knowledge check live inside the power-flow view.

The handoff attacks the moment responsibility changes hands. The lens attacks the moment someone learns the system. Both target the same industry problem: senior operational expertise is disappearing.

This prototype is intentionally honest about domain uncertainty. Values are simulated, and assumptions that should be validated with subject-matter experts are labeled in the interface.

## Two-minute interview walkthrough

The Shift Brief opens on load. Present it first.

1. **Read the handoff.** "Sarah Chen handed Louie the site at 19:00." Two items need attention, one is listed so the incoming operator knows it was investigated. Every collapsed row already shows its "what you need to do" line.
2. **Expand item 01 and read it slowly.** The six rows are the product: what changed, what we know, what was decided, why, who decided, what you need to do. The last row is an instruction with a threshold the previous operator chose.
3. **Point at "What changed since 19:02."** New, Changed, Resolved, No change. A diff for a building. The confidence line, 0.71 to 0.82, ties to the AI hypothesis shown next.
4. **Click "Open on graph" on item 01.** The brief closes, the graph pans and zooms onto UPS-A1 with a short pulse, the affected path traces in amber, and the Learning Lens opens on the **Evidence** tab with Sarah's decision shown above the AI hypothesis. Nodes that carry a handoff decision show a small clipboard marker.
5. **Click any asset.** The lens follows it. Open the accordion sections to show definition, operational significance, and signals to watch.
6. **Drag a node, then reset.** The circular-arrow **Reset layout** control under the zoom buttons restores the layout. The graph is a live layout, not a picture.
7. **Walk the guided steps on the left.** **Check redundancy** selects UPS-B1. **Choose an action** opens the **Check** tab. Answer the quick check.
8. **Click "Shift brief" in the top bar.** The handoff is available for the whole shift, not only at the start.
9. Click the ⓘ next to "Operator learning mode" to show how simulated values and assumptions are labeled.

One sentence that ties both halves together: the graph teaches a new operator the system, and the brief transfers the previous operator's judgment.

## How to frame it

> I did not want to pretend I already knew data-center operations. I wanted to show how I learn a technical domain, turn uncertainty into explicit assumptions, and build something an expert can correct. I used Neuron's visual language as a starting point and explored how its digital twin could also help onboard operators and cross-functional teammates.

## Scope

Built:

- Shift Brief with three handoff items, a six-field decision record per item, a "what changed" diff, and "Open on graph" links into the investigation
- Interactive React Flow power path with draggable nodes, persisted layout, and reset
- Utility, transformer, switchgear, UPS, PDU, and rack concepts
- A/B redundancy scenario
- Guided investigation steps
- Contextual Learning Lens with Learn, Evidence, and Check tabs
- Simulated AI hypothesis with visible confidence
- Knowledge check and feedback state
- Mock live telemetry with a simulated refresh timer
- Keyboard selection of graph nodes, tab arrow-key navigation, and announced quiz feedback

Not built:

- Decision timeline and "challenge this assessment" evidence view. Both are the next step after the handoff is validated with a real operator.
- Authoring flow for the outgoing operator. The handoff is read-only.
- Search
- Production telemetry or industrial protocol integrations
- Real AI inference
- Authentication or persistence beyond the browser's local storage
- Validated electrical engineering calculations

## Stack

- Vite
- React 19
- TypeScript
- React Flow
- Phosphor Icons
- CSS design tokens set from `src/theme.ts`

## Code map

- `src/App.tsx` owns state and renders the graph.
- `src/components/` holds the shift brief, left panel, right panel, node card, and reset control.
- `src/data/scenario.ts` holds the nodes, connections, guided steps, quiz, telemetry baseline, and the shift handoff under `shiftHandoff`. Every name, time, and threshold there is fictional.
- `src/layoutStorage.ts` persists dragged node positions.
- `src/useMockTelemetry.ts` drives the simulated telemetry bar.

## Run locally

```bash
npm install
npm run dev
```

## Build and verify

```bash
npx tsc --noEmit
npm run test:sites
```

`npm run test:sites` runs the production build first, then the worker and packaging tests.
