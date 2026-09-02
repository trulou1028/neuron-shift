# Neuron Field Notes

An exploratory React Flow prototype with two connected ideas: a shift handoff that transfers the previous operator's decisions and reasoning, and a learning layer that teaches the power path while an operator investigates a signal.

## The product idea

Neuron already holds telemetry, topology, incidents, procedures, and operator decisions. This prototype asks how that intelligence should transfer between people.

- **Neuron Shift.** At the start of a shift, the incoming operator receives a structured handoff: what changed, what is known, what was decided, why, who decided, and what they need to do. Most systems preserve data. This preserves why a human made a decision.
- **Anchored AI.** Neuron answers the questions an operator would ask about an asset before they ask them, and renders consequences on the graph rather than in prose. There is no chat box.
- **Learning layer.** A personal onboarding overlay in its own colour, off by default. Real operators already know this material, so it is deliberately layered on rather than built in.

The handoff attacks the moment responsibility changes hands. The anchored AI attacks the moment an operator has to act on a live signal. Both target the same industry problem: senior operational expertise is disappearing.

### A position on chat

Chat is the right fallback and the wrong default. It asks the operator to supply the question at the moment they have the least time and the least certainty about what to ask. Its answers do not attach to an asset, do not persist, and cannot be inherited by the next shift. So the AI here follows three rules. It attaches to objects rather than to a conversation. Its output is interface state rather than prose. And anything the operator accepts or overrides becomes part of the handoff record.

This prototype is intentionally honest about domain uncertainty. Values are simulated, and assumptions that should be validated with subject-matter experts are labeled in the interface.

## Two-minute interview walkthrough

The Shift Brief opens on load. Present it first.

1. **Read the handoff.** "Sarah Chen handed Louie the site at 19:00." Two items need attention, one is listed so the incoming operator knows it was investigated. Every collapsed row already shows its "what you need to do" line.
2. **Expand item 01 and read it slowly.** The six rows are the product: what changed, what we know, what was decided, why, who decided, what you need to do. The last row is an instruction with a threshold the previous operator chose.
3. **Point at "What changed since 19:02."** New, Changed, Resolved, No change. A diff for a building. The confidence line, 0.71 to 0.82, ties to the AI hypothesis shown next.
4. **Click "Open on graph" on item 01.** The brief closes, the graph pans and zooms onto UPS-A1 with a short pulse, the affected path traces in amber, and the asset panel opens on the **Evidence** tab with Sarah's decision shown above the AI hypothesis. Nodes that carry a handoff decision show a small clipboard marker.
5. **Open the Ask tab.** Neuron has already answered the questions for this asset, so there is no prompt to compose. Each answer cites assets by name.
6. **Open the Impact tab on UPS-A1.** Nothing loses power and three assets are held by redundancy. Now select PDU-05 and look again: two racks lose power and nothing covers them. The graph draws the de-energised path in dashed red. That contrast is the point.
7. **Drag a node, then reset.** The circular-arrow **Reset layout** control under the zoom buttons restores the layout. The graph is a live layout, not a picture.
8. **Turn on the Learning layer** in the toolbar. A violet section appends below the operator panel with definitions, a glossary for the acronyms on screen, and an optional self-test. The line to say: I am not the user, so my scaffolding switches off.
9. **Click "Shift brief" in the top bar.** The handoff is available for the whole shift, not only at the start.
10. Click the ⓘ next to "Operator learning mode" to show how simulated values and assumptions are labeled.

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
- Asset panel with Ask, Evidence, and Impact tabs
- Anchored questions answered per asset, each citing named assets
- Failure impact computed from the real topology, separating what drops from what redundancy holds
- Learning layer as a separate violet overlay, off by default, with a glossary and optional self-test
- Simulated AI hypothesis with visible confidence
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
- `src/components/` holds the shift brief, left panel, asset panel, learning layer, node card, and reset control.
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
