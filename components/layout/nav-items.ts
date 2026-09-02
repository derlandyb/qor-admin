export type AdminRole = "super_admin" | "venue_admin" | "promoter";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  roles: AdminRole[];
}

/** design-system-admin.md §5.1 QOR mapping. */
export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    roles: ["super_admin", "venue_admin", "promoter"],
  },
  {
    key: "account-approvals",
    label: "Aprovação de Contas",
    href: "/aprovacoes/contas",
    roles: ["super_admin"],
  },
  {
    key: "event-approvals",
    label: "Aprovação de Eventos",
    href: "/aprovacoes/eventos",
    roles: ["super_admin"],
  },
  {
    key: "my-events",
    label: "Meus Eventos",
    href: "/eventos",
    roles: ["venue_admin", "promoter"],
  },
  {
    key: "plans",
    label: "Planos",
    href: "/planos",
    roles: ["super_admin"],
  },
  {
    key: "subscription",
    label: "Assinatura",
    href: "/assinatura",
    roles: ["venue_admin", "promoter"],
  },
];

export function navItemsForRole(role: AdminRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
