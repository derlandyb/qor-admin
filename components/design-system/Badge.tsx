import type { ReactNode } from "react";
import type { AdminColor } from "./Button";

export interface BadgeProps {
  color: AdminColor;
  children: ReactNode;
}

/**
 * Solid-fill badge per design-system-admin.md §5.6 — bg=accent color,
 * `border-radius: 4px` (`rounded-admin-badge`), `padding: 4px 6px`,
 * `font-size: 12px`, `font-weight: 500`. Non-interactive status label.
 */
const BG_TEXT: Record<AdminColor, string> = {
  primary: "bg-admin-primary text-white",
  secondary: "bg-admin-secondary text-admin-dark",
  success: "bg-admin-success text-white",
  danger: "bg-admin-danger text-white",
  warning: "bg-admin-warning text-white",
  info: "bg-admin-info text-white",
  light: "bg-admin-light text-admin-dark",
  dark: "bg-admin-dark text-white",
};

export function Badge({ color, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-admin-badge px-2 py-0.5 text-xs font-medium ${BG_TEXT[color]}`}
    >
      {children}
    </span>
  );
}
