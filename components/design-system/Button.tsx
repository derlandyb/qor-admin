import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * The 6 semantic accent colors from design-system-admin.md §1.2, shared by
 * Button/Badge/ProgressBar.
 */
export type AdminColor =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export type ButtonVariant = "solid" | "outline" | "pill";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  color?: AdminColor;
  variant?: ButtonVariant;
  children: ReactNode;
}

/**
 * `light`/`secondary` are pale surfaces (§1.2) — they need dark text for
 * contrast on `solid`/`pill`. Every other color gets white text.
 */
const SOLID_BG_TEXT: Record<AdminColor, string> = {
  primary: "bg-admin-primary text-white",
  secondary: "bg-admin-secondary text-admin-dark",
  success: "bg-admin-success text-white",
  danger: "bg-admin-danger text-white",
  warning: "bg-admin-warning text-white",
  info: "bg-admin-info text-white",
  light: "bg-admin-light text-admin-dark",
  dark: "bg-admin-dark text-white",
};

const OUTLINE_BORDER_TEXT: Record<AdminColor, string> = {
  primary: "border-admin-primary text-admin-primary",
  secondary: "border-admin-secondary text-admin-secondary",
  success: "border-admin-success text-admin-success",
  danger: "border-admin-danger text-admin-danger",
  warning: "border-admin-warning text-admin-warning",
  info: "border-admin-info text-admin-info",
  light: "border-admin-light text-admin-light",
  dark: "border-admin-dark text-admin-dark",
};

/**
 * Button per design-system-admin.md §5.7 — 6 semantic colors x
 * solid/outline/pill styles, `padding: 6px 12px`, `font-size: 15px`,
 * 150ms ease-in-out transition on color/background-color/border-color/
 * box-shadow. `pill` (rounded/pill variant) is the doc's recommended
 * default.
 */
export function Button({
  color = "primary",
  variant = "pill",
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-3 py-1.5 text-[15px] font-normal transition-[color,background-color,border-color,box-shadow] duration-admin-control ease-admin-control border";

  let styleClasses: string;
  if (variant === "outline") {
    styleClasses = `bg-transparent rounded-admin-button border ${OUTLINE_BORDER_TEXT[color]}`;
  } else if (variant === "pill") {
    styleClasses = `rounded-admin-button-pill border-transparent ${SOLID_BG_TEXT[color]}`;
  } else {
    styleClasses = `rounded-admin-button border-transparent ${SOLID_BG_TEXT[color]}`;
  }

  return (
    <button
      className={`${base} ${styleClasses}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
