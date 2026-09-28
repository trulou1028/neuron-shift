import type { CSSProperties } from "react";

// Single source of truth for colors shared between the React Flow props and the stylesheet.
// The stylesheet reads these through CSS custom properties applied on `.app-shell`.
//
// Chrome is warm graphite and carries no hue. Hue is reserved for state, one meaning each:
// flow (healthy power), condition (equipment needs watching), owed (a human owes a decision),
// ai (Neuron's output), learn (the onboarding layer).
export const palette = {
  bg: "oklch(0.145 0.004 75)",
  surface: "oklch(0.172 0.005 75)",
  surface2: "oklch(0.2 0.006 75)",
  surface3: "oklch(0.235 0.007 75)",
  rule: "oklch(0.275 0.007 75)",
  ruleStrong: "oklch(0.36 0.008 75)",
  ink: "oklch(0.95 0.006 85)",
  ink2: "oklch(0.82 0.008 85)",
  ink3: "oklch(0.68 0.01 85)",
  flow: "oklch(0.8 0.13 155)",
  condition: "oklch(0.83 0.15 78)",
  owed: "oklch(0.68 0.2 25)",
  ai: "oklch(0.83 0.09 210)",
  learn: "oklch(0.77 0.12 295)",
  deferred: "oklch(0.8 0.05 250)",
  graphGrid: "oklch(0.26 0.006 75)",
  minimapMask: "oklch(0.145 0.004 75 / 0.8)",
} as const;

type CssVariables = CSSProperties & Record<`--${string}`, string>;

export const cssVariables: CssVariables = {
  "--bg": palette.bg,
  "--surface": palette.surface,
  "--surface-2": palette.surface2,
  "--surface-3": palette.surface3,
  "--rule": palette.rule,
  "--rule-strong": palette.ruleStrong,
  "--ink": palette.ink,
  "--ink-2": palette.ink2,
  "--ink-3": palette.ink3,
  "--flow": palette.flow,
  "--condition": palette.condition,
  "--owed": palette.owed,
  "--ai": palette.ai,
  "--learn": palette.learn,
  "--deferred": palette.deferred,
};
