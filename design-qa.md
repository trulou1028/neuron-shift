# Design QA

QA record for the portfolio revamp (September 2026). The source of truth is `DESIGN.md` for the visual system and `PRODUCT.md` for the principles. There is no reference mock. The earlier QA pass against the Teserac-inspired mock no longer applies and was replaced by this record.

## Evidence

- Local dev server, Chromium-based browser pane, device pixel ratio 1.
- Every check below was done by driving the real interface and reading the result, not by reading code.
- Browser storage was cleared before first-visit checks, so the tour and the brief behaved as they would for a new visitor.

## Viewports

| Viewport | What was checked | Result |
|---|---|---|
| 1440 × 900 | Full tour, shift brief, power-up, trace, impact preview, decision gate, pinned decision, learning layer | Passed |
| 1100 × 760 | Three-column layout, toolbar, canvas bounds | Passed after fix (see findings) |
| 1280 × 720 | Shift brief and decision dialog footers | Passed after fix (see findings) |
| 375 × 812 | Phone fallback page | Passed |

## Interaction verification

- **Shift brief.** Opens on load. Item 01 expands with a height transition. "Open on graph" closes the brief, frames UPS-A1 with its neighbors, pulses it, and traces the affected path.
- **Power-up.** The graph stays unpowered behind the brief. On "Start shift" it powers up in path order, source first. Captured mid-sequence with the source-side assets lit and the load side still dim.
- **Power flow.** Dots travel along every live edge. The traced path runs faster in amber.
- **Color semantics.** UPS-A1 and SWGR-A show red with "Needs your decision". Rack R-42 stays amber. The toolbar reads "2 need your decision".
- **Impact preview.** Opening the Impact tab draws the preview. On UPS-A1, nothing loses power and three assets are held. On PDU-05, both racks go dark: gray dashed lines, struck-through readings, "Loses power" labels. No red appears in the preview.
- **Decision gate.** On UPS-A1, "Record" stays disabled until all four checks are ticked and the asset name is typed. The counter reads 5/5 when complete. On SWGR-A, approval is one click.
- **After a decision.** The asset turns green with "Decided by you". The toolbar count drops from 2 to 1. The decision card pins beside the asset without covering the next column. The preview clears so the change is visible.
- **Learning layer.** The toggle turns violet and the layer appears below the asset panel.
- **Guided tour.** All seven steps completed with both real actions and "Do it for me". The ring follows its target through pans, zooms, and dialogs. Steps that show a result hold for Next.
- **Tour card placement.** At 1440 × 900 the card does not cover the brief, the impact counts, any red asset on the colors step, or the dark racks on the comparison step.
- **Build.** `npx tsc --noEmit` passes. `npm run test:sites` passes 4 of 4 and leaves `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Findings

Fixed during the pass:

- [P1] On short laptop screens the shift brief's "Start shift" footer fell below the fold. Both dialogs now cap at the screen height, scroll only their middle, and keep the footer in view. Verified at 1280 × 720.
- [P1] At 1100 px the center column sized itself to its toolbar, so the canvas ran under the asset panel. Fixed by constraining the column and tightening the toolbar below 1180 px.
- [P1] The approval gate asked for "UPS-A", an internal id, instead of the asset name "UPS-A1". Fixed to use the name shown on the graph.
- [P2] The failure preview stayed on after a decision, which hid the "Decided by you" state. Recording a decision now returns to the plain view.
- [P2] Pinned decision cards landed on the next column of the graph. Cards now sit beside their asset on the open side.
- [P2] The left-to-right graph rendered at about 60% zoom in a tall canvas. Turned top to bottom, which is also the usual orientation for one-line diagrams.
- [P2] Tour cards covered the content their step explained. Placement now scores spots by how much of the graph they hide.
- [P3] Tint mixing in OKLCH shifted green rails toward olive. Tints now mix in OKLab.

Open:

- [P3] Tour card placement was verified at 1440 × 900. Between 1000 and 1280 px wide the canvas is narrow, and a card may cover part of an asset.
- [P3] `prefers-reduced-motion` was implemented but not verified with an emulated preference. The CSS and Motion configuration were reviewed instead.
- [P3] Not captured on screen: the green settle ring after a decision, and the learning layer scrolling itself into view. Both are implemented.
- [P3] The local dev server does not map `/case-study` to `case-study.html`, so that link shows the app in dev. Vercel maps it in production (`vercel.json`).

## Checklist

- [x] Color carries one meaning each, and every colored state is also named in text
- [x] Primary actions and selection use ink, not a hue
- [x] Numbers, times, and identifiers use the mono face
- [x] Motion conveys state only
- [x] Tour completes end to end, by hand and by "Do it for me"
- [x] Phone fallback replaces the console below 1000 px
- [x] Type check and Sites tests pass

final result: passed, with the open items above
