import type { CSSProperties } from "react";

// Single source of truth for colors shared between the React Flow props and the stylesheet.
// The stylesheet reads these through CSS custom properties applied on `.app-shell`.
export const palette = {
  bg: "#07090c",
  panel: "#0e1116",
  border: "#252b34",
  text: "#eef1f5",
  text2: "#b3bcc7",
  muted: "#7c8794",
  green: "#34d27b",
  amber: "#f5a524",
  blue: "#5b95f5",
  cyan: "#47d6ea",
  violet: "#a78bfa",
  danger: "#fb4f5b",
  graphGrid: "#25303b",
  minimapMask: "rgba(6, 9, 13, .78)",
} as const;

type CssVariables = CSSProperties & Record<`--${string}`, string>;

export const cssVariables: CssVariables = {
  "--bg": palette.bg,
  "--panel": palette.panel,
  "--border": palette.border,
  "--text": palette.text,
  "--text-2": palette.text2,
  "--muted": palette.muted,
  "--green": palette.green,
  "--amber": palette.amber,
  "--blue": palette.blue,
  "--cyan": palette.cyan,
  "--violet": palette.violet,
  "--danger": palette.danger,
};
