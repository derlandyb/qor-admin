import type { ButtonHTMLAttributes } from "react";

export type ButtonColor =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export type ButtonStyleVariant = "default" | "inverse" | "rounded" | "outline";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  variant?: ButtonStyleVariant;
}

const SOLID_BG: Record<ButtonColor, string> = {
  primary: "bg-admin-primary text-white hover:bg-admin-primary/85",
  secondary: "bg-admin-secondary text-admin-dark hover:bg-admin-secondary/85",
  success: "bg-admin-success text-white hover:bg-admin-success/85",
  danger: "bg-admin-danger text-white hover:bg-admin-danger/85",
  warning: "bg-admin-warning text-admin-dark hover:bg-admin-warning/85",
  info: "bg-admin-info text-white hover:bg-admin-info/85",
  light: "bg-admin-light text-admin-dark hover:bg-admin-light/85",
  dark: "bg-admin-dark text-white hover:bg-admin-dark/85",
};

const INVERSE: Record<ButtonColor, string> = {
  primary: "bg-admin-primary/15 text-admin-primary hover:bg-admin-primary/25",
  secondary: "bg-admin-secondary/15 text-admin-secondary hover:bg-admin-secondary/25",
  success: "bg-admin-success/15 text-admin-success hover:bg-admin-success/25",
  danger: "bg-admin-danger/15 text-admin-danger hover:bg-admin-danger/25",
  warning: "bg-admin-warning/15 text-admin-warning hover:bg-admin-warning/25",
  info: "bg-admin-info/15 text-admin-info hover:bg-admin-info/25",
  light: "bg-admin-light/15 text-admin-light hover:bg-admin-light/25",
  dark: "bg-admin-dark/40 text-admin-text-primary hover:bg-admin-dark/60",
};

const OUTLINE: Record<ButtonColor, string> = {
  primary: "border border-admin-primary text-admin-primary hover:bg-admin-primary hover:text-white",
  secondary:
    "border border-admin-secondary text-admin-secondary hover:bg-admin-secondary hover:text-admin-dark",
  success: "border border-admin-success text-admin-success hover:bg-admin-success hover:text-white",
  danger: "border border-admin-danger text-admin-danger hover:bg-admin-danger hover:text-white",
  warning: "border border-admin-warning text-admin-warning hover:bg-admin-warning hover:text-admin-dark",
  info: "border border-admin-info text-admin-info hover:bg-admin-info hover:text-white",
  light: "border border-admin-light text-admin-light hover:bg-admin-light hover:text-admin-dark",
  dark: "border border-admin-dark text-admin-text-primary hover:bg-admin-dark hover:text-white",
};

const RADIUS_BY_VARIANT: Record<ButtonStyleVariant, string> = {
  default: "rounded-admin-default",
  inverse: "rounded-admin-default",
  rounded: "rounded-admin-pill",
  outline: "rounded-admin-default",
};

const COLOR_CLASSES_BY_VARIANT: Record<ButtonStyleVariant, Record<ButtonColor, string>> = {
  default: SOLID_BG,
  rounded: SOLID_BG,
  inverse: INVERSE,
  outline: OUTLINE,
};

/**
 * design-system-admin.md §5.7 — Default/Inverse/Rounded(pill)/Outline style
 * families x 8 semantic colors. padding 6px 12px, font-size 16px,
 * min-width 128px. No hover transition class (§4 — instant snap by design,
 * not an oversight).
 */
export function Button({
  color = "primary",
  variant = "rounded",
  className = "",
  ...rest
}: ButtonProps) {
  const colorClass = COLOR_CLASSES_BY_VARIANT[variant][color];
  const radiusClass = RADIUS_BY_VARIANT[variant];

  return (
    <button
      {...rest}
      className={`min-w-admin-button-min-width px-3 py-1.5 text-base font-medium ${radiusClass} ${colorClass} ${className}`}
    />
  );
}
