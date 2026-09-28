# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Design decisions (portfolio revamp, September 2026)

Louie decided these. Keep them unless he changes them. `PRODUCT.md` holds the principles and `DESIGN.md` holds the visual system.

- The prototype is part of Louie's portfolio. Most visitors explore alone, so the guided tour (`src/data/tour.ts`) is a first-class feature. Keep it working when the interface changes: every step's selector and completion state must still match.
- The visual identity is Louie's own, not the look the project started from. Direction: a precision instrument. Warm graphite, hairline rules, IBM Plex Sans and Plex Mono, color reserved for state.
- Each hue has one meaning. Red is only for a decision a person owes. Loss of power is shown as absence (gray dashes, dark asset), not red.
- Phones get a designed fallback page, not a responsive console.
