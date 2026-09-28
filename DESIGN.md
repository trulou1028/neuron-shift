# Design

## Visual theme

A precision instrument for a night-shift control room. Warm graphite surfaces, fine hairline rules, monospaced numbers, and nothing decorative. The chrome carries no hue. Hue is reserved for state, and each hue has one meaning. When something needs a person, it is the only red thing on the screen.

Dark because the fictional user works a night shift in a dim control room, and because the argument of the prototype depends on a few colored signals standing out against a quiet field.

## Color

All colors are OKLCH and live in `src/theme.ts`. The stylesheet reads them as custom properties on `.app-shell`. Tints are derived in CSS with `color-mix(in oklab, …)` so they keep their hue.

### Neutrals (warm graphite, hue 75, chroma under 0.01)

| Token | Value | Use |
|---|---|---|
| `--bg` | `oklch(0.145 0.004 75)` | Canvas, inset fields |
| `--surface` | `oklch(0.172 0.005 75)` | Panels, cards, dialogs |
| `--surface-2` | `oklch(0.2 0.006 75)` | Raised controls, hover |
| `--surface-3` | `oklch(0.235 0.007 75)` | Pressed, hover on raised |
| `--rule` | `oklch(0.275 0.007 75)` | Hairlines |
| `--rule-strong` | `oklch(0.36 0.008 75)` | Control borders, node borders |
| `--ink` | `oklch(0.95 0.006 85)` | Primary text, primary buttons, selection |
| `--ink-2` | `oklch(0.82 0.008 85)` | Body text |
| `--ink-3` | `oklch(0.68 0.01 85)` | Labels and meta. Meets 4.5:1 on `--surface` |

### State hues (one meaning each)

| Token | Meaning | Never used for |
|---|---|---|
| `--flow` | Power is flowing, the asset is healthy, a decision was made | Buttons, decoration |
| `--condition` | The equipment has a condition worth watching | Anything a person must act on |
| `--owed` | A person owes a decision | Failures, errors, loss of power |
| `--ai` | Neuron's own output: answers, hypotheses, confidence | Human decisions |
| `--learn` | The learning layer, which is not part of the operator tool | Operator UI |
| `--deferred` | A decision deferred with a trigger | Anything else |

Loss of power in the failure preview is shown as absence, not as a hue: the flow stops, the rail becomes gray dashes, the asset goes dark and its reading is struck through. Red stays reserved for owed decisions.

Primary actions and selection use `--ink`, not a hue. A primary button is a light key on a dark panel.

## Typography

- **IBM Plex Sans** (400, 500, 600) for all UI text. Engineering heritage, clear at small sizes, matches the case study.
- **IBM Plex Mono** (400, 500) for every number, time, identifier, and typed confirmation. Tabular figures so live values do not jitter.
- Fixed pixel scale: 11, 11.5, 12, 12.5, 13, 14, 15, 17 (node readings), 19–20, 22, 24. No fluid type.
- Sentence case everywhere. No tracked uppercase eyebrows.

## Shape and depth

- Radii: 4 px tags and chips, 6 px controls and nodes, 8 px cards, 10 px dialogs and the tour card.
- Borders are 1 px hairlines. No side-stripe accents.
- Depth comes from a subtle inset top highlight plus a soft drop shadow on floating elements only (nodes, pinned cards, dialogs, the tour card).
- The canvas background is a faint cross grid, like engineering paper.

## Components

- **Power node.** Eyebrow, status LED (square), title, mono reading colored by condition, and a footer tag that names any state in words: "Needs your decision", "Decided by you", "If this fails", "Loses power", "Held by redundancy".
- **Power edge.** A dim rail plus a line of dots that travel from source to load. Traced edges run faster in the condition color. De-energized edges stop and turn to gray dashes.
- **Buttons.** Primary (ink key), secondary (raised graphite), quiet (text only). 32 px, or 40 px for dialog commits. Press scales to 0.97.
- **Tags.** 22 px, 4 px radius, tinted by state hue or neutral.
- **Tabs.** Text tabs over a hairline, with an ink underline that slides between them.
- **Segmented choice.** The four decision options share one track; an ink indicator slides to the picked one.
- **Tour card.** A light card on the dark console, so it reads plainly as a guide rather than part of the tool. An ink ring follows the element it points at.

## Layout

- Three columns: investigation rail (220–272 px), power path canvas (fluid), asset panel (292–360 px). Top bar 52 px.
- The power path runs top to bottom, source to load, the usual orientation for an electrical one-line diagram. It fills the tall canvas far better than a left-to-right strip.
- Below 1000 px wide the console is replaced by a phone page.

## Motion

Motion conveys state. Presets live in `src/motion.ts`; CSS keyframes cover the continuous effects.

| Moment | Motion |
|---|---|
| Taking the shift | The graph waits unpowered behind the brief, then powers up asset by asset from the utility feed down, 120 ms apart |
| Power flow | Dots travel along every live edge. Faster and amber on the traced path. Stopped where power would be lost |
| Decision owed | A red ring expands from the asset every 2.4 s |
| Decision recorded | One green ring settles on the asset, the count in the toolbar rolls down, the pinned card scales in |
| Dialogs | Fade, rise and unblur in 380 ms (ease-out-expo). Exit in 180 ms |
| Disclosures | Height and fade, 300 ms (ease-out-quint) |
| Tabs, asset change | Content fades up 4 px in 220 ms |
| Live telemetry | Changed values fade up from 35% opacity |

Easing is exponential ease-out only. No bounce or elastic. Under `prefers-reduced-motion`, all continuous motion stops and transitions become instant; state stays legible because every state is also named in text.
