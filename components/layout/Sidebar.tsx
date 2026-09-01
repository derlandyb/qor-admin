"use client";

import { useState } from "react";
import { type AdminRole, navItemsForRole } from "./nav-items";

export interface SidebarProps {
  role: AdminRole;
  userName: string;
  roleLabel: string;
  activeHref?: string;
  onNavigate?: (href: string) => void;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  venue_admin: "Venue Admin",
  promoter: "Promoter",
};

/**
 * design-system-admin.md §5.1 — fixed 244px dark rail, collapse/expand via
 * `transition-all duration-300 ease-in-out` on the <nav> element itself
 * (§4's only measured animation in this whole design system; nav-item
 * hover/active state itself is an instant snap, no transition).
 */
export function Sidebar({ role, userName, roleLabel, activeHref, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const items = navItemsForRole(role);

  return (
    <nav
      aria-label="Navegação principal"
      data-collapsed={collapsed}
      className={`flex h-full flex-col bg-admin-bg-surface text-admin-text-primary transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-admin-sidebar-width"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-default bg-admin-primary font-bold text-admin-text-primary"
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[15px] leading-[15px]">{userName}</p>
            <p className="truncate text-xs text-admin-text-muted">{roleLabel || ROLE_LABELS[role]}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="ml-auto shrink-0 rounded-admin-default p-1 text-admin-text-muted hover:text-admin-text-primary"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {!collapsed && (
        <p className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-admin-text-muted">
          Navigation
        </p>
      )}

      <ul className="flex flex-1 flex-col gap-1 px-2">
        {items.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <li key={item.key}>
              <a
                href={item.href}
                onClick={(event) => {
                  if (onNavigate) {
                    event.preventDefault();
                    onNavigate(item.href);
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-admin-default px-3 py-2 text-sm ${
                  isActive
                    ? "bg-admin-primary text-white"
                    : "text-admin-text-secondary hover:bg-white/5 hover:text-admin-text-primary"
                }`}
              >
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-current" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
