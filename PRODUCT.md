# Product

## Register

product

## Users

Two audiences, one surface.

- **The fictional user.** A data center operator starting a night shift in a dim control room. They inherit the site from the previous operator, read what was decided and why, and investigate a live signal on the power path. They are experts under time pressure.
- **The real user.** A hiring manager or design lead who opens the prototype from Louie's portfolio. Nobody walks them through it. They have about two minutes and a laptop. They need to reach the three ideas that matter (the handoff record, color that means "a human owes a decision", friction that scales with reversibility) without reading the README.

## Product Purpose

Neuron Shift is an independent concept prototype. It explores how operational judgment transfers between people in 24/7 data center operations: a structured shift handoff, AI that attaches to assets instead of a chat box, and human-in-the-loop decisions that become the record the next shift inherits. It is not affiliated with Teserac.

Success: a visitor who explores alone for two minutes can say what the handoff preserves, why an asset is red, and why approving one recommendation took more effort than the other.

## Brand Personality

Precise, calm, expert. It should feel like a well-made instrument: exact numbers, fine rules, nothing decorative, one clear signal when something needs a human. Confidence comes from restraint and correctness, not from effects.

## Anti-references

- Sci-fi HUD interfaces: glowing cyan everything, scan lines, hexagons, fake 3D.
- Generic SaaS dashboards: rounded cards in identical grids, a blue primary button on every surface, hero metrics with gradient accents.
- The original Teserac-inspired look this project started from. The new identity is Louie's own.
- Chat-first AI products. There is deliberately no prompt box.

## Design Principles

1. **Color carries one meaning each.** Chrome is monochrome. Hue is reserved for state: equipment condition, a decision a human owes, AI output, the learning layer. A color never decorates.
2. **Practice what you preach.** The prototype argues that friction should scale with reversibility and that the AI should show, not chat. Every interaction must obey the same rules it argues for.
3. **Show the consequence on the graph.** When something changes (a trace, a failure preview, a decision) the power path shows it. Prose is the fallback.
4. **Motion conveys state.** Power flows because power flows. A node changes color because a decision changed. No motion exists only to decorate.
5. **Honest about uncertainty.** Simulated values and domain assumptions stay labeled so an expert can correct them.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast for all text, including muted labels.
- Every animation has a `prefers-reduced-motion` alternative. Continuous motion (power flow, review pulse) stops under reduced motion.
- Full keyboard path: graph nodes, tabs (arrow keys), dialogs (focus trap, Escape), and the guided tour.
- State is never carried by color alone. Every colored state also has a text label or icon.
