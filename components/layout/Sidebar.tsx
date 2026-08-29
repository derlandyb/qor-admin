"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The three admin-guard account kinds (ARCHITECTURE §2 — venue/promoter/
 * super admin credential space). Not a mirror of a backed PHP enum, so it
 * does not live in `lib/enums` — it is this repo's own view-layer concept
 * for role-scoped navigation.
 */
export type AdminRole = "super_admin" | "venue_admin" | "promoter";

interface NavItem {
  href: string;
  label: string;
  roles: AdminRole[];
  icon: ReactNode;
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 20c0-3.6 2.9-6 5.5-6s5.5 2.4 5.5 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 6.5a3.2 3.2 0 0 1 0 6.4M18.7 20c0-3-2-5.2-4.4-5.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M8.5 13.5l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MyEventsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="14" r="1.4" fill="currentColor" />
      <circle cx="15.5" cy="14" r="1.4" fill="currentColor" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    roles: ["super_admin", "venue_admin", "promoter"],
    icon: <DashboardIcon />,
  },
  {
    href: "/aprovacao-contas",
    label: "Aprovação de Contas",
    roles: ["super_admin"],
    icon: <AccountsIcon />,
  },
  {
    href: "/aprovacao-eventos",
    label: "Aprovação de Eventos",
    roles: ["super_admin"],
    icon: <EventsIcon />,
  },
  {
    href: "/meus-eventos",
    label: "Meus Eventos",
    roles: ["venue_admin", "promoter"],
    icon: <MyEventsIcon />,
  },
];

export interface SidebarProps {
  role: AdminRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className="w-admin-sidebar shrink-0 bg-admin-bg-surface border-r border-admin-border-subtle flex flex-col py-6"
      aria-label="Navegação principal"
    >
      <div className="px-6 pb-6">
        <span className="text-admin-h5 font-medium text-admin-text-primary">QOR Admin</span>
      </div>

      <p className="px-6 pb-2 text-xs font-medium uppercase tracking-wide text-admin-text-secondary">
        Navegação
      </p>

      <nav>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 py-2.5 pl-6 pr-4 mr-4 rounded-[0_100px_100px_0] text-admin-body transition-[color,background-color] duration-admin-nav ease-admin-nav ${
                    isActive
                      ? "bg-admin-primary text-admin-text-primary"
                      : "text-admin-text-secondary hover:bg-admin-primary hover:text-admin-text-primary"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
