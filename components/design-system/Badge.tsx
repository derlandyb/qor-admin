import type { ReactNode } from "react";

export type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
}

const BADGE_CLASSES: Record<BadgeColor, string> = {
  primary: "bg-admin-primary text-white",
  secondary: "bg-admin-secondary text-admin-dark",
  success: "bg-admin-success text-white",
  danger: "bg-admin-danger text-white",
  warning: "bg-admin-warning text-admin-dark",
  info: "bg-admin-info text-white",
  light: "bg-admin-light text-admin-dark",
  dark: "bg-admin-dark text-white",
};

/** design-system-admin.md §5.6's solid-fill badge style, decoupled from the status enum (StatusPill) for arbitrary labels ("Novo", plan tiers, etc). */
export function Badge({ color = "primary", children }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-admin-default px-1.5 py-1 text-xs font-medium ${BADGE_CLASSES[color]}`}
    >
      {children}
    </span>
  );
}
