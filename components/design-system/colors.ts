/**
 * design-system-admin.md §1.2/§1.3 — the 5-color semantic data-viz rotation,
 * as hex values for contexts that can't use a Tailwind utility class
 * (inline SVG stroke, CSS conic-gradient stops). Single source of truth for
 * DonutWidget and ProgressBar's circular variant.
 */
export type SemanticDataColor = "success" | "primary" | "info" | "warning" | "danger";

export const SEMANTIC_COLOR_HEX: Record<SemanticDataColor, string> = {
  success: "#00D25B",
  primary: "#0090E7",
  info: "#8F5FE8",
  warning: "#FFAB00",
  danger: "#FC424A",
};
