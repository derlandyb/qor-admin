"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type AdminRole } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { apiClient } from "@/lib/api/client";
import { readAdminProfile } from "@/lib/admin-profile";

/**
 * Wraps every authenticated admin page (everything except /entrar, which
 * lives outside this route group) with the Corona Sidebar/Topbar shell.
 * Role is derived from the qor_admin_profile cookie set at login — a
 * display-only value, never a security boundary (see lib/api/session-cookie.ts).
 * Venue Admin and Promoter accounts render identical nav, so both map to
 * the "venue_admin" AdminRole case; Sidebar has no separate promoter case.
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; role: AdminRole } | null | undefined>(
    undefined,
  );

  useEffect(() => {
    function load() {
      const stored = readAdminProfile();
      if (!stored) {
        setProfile(null);
        router.push("/entrar");
        return;
      }
      setProfile({ name: stored.name, role: stored.isSuperAdmin ? "super_admin" : "venue_admin" });
    }
    load();
    // Mount-only: reads a cookie and (on redirect) calls router.push once.
    // Real Next.js router objects are stable across renders, but this
    // effect intentionally never re-runs even if that weren't the case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await apiClient.auth.logout().catch(() => undefined);
    router.push("/entrar");
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex min-h-full">
      <Sidebar role={profile.role} />
      <div className="flex flex-1 flex-col">
        <Topbar
          userName={profile.name}
          onCreateEvent={() => router.push("/eventos/novo")}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
