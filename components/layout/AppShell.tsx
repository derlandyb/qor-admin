"use client";

/**
 * AT22 — wires Sidebar/Topbar around every authenticated page, using
 * useSession()'s resolved account_type for role-aware nav (navItemsForRole,
 * already built). PUBLIC_PATHS (the login page, plus the two self-
 * registration pages a Venue/Promoter reaches before any account exists at
 * all) render bare — no chrome, no auth redirect. An unauthenticated
 * visitor anywhere else is redirected to /entrar; the client's existing
 * UnauthenticatedError/redirectToLogin() (lib/api/http.ts) already does
 * this as a side effect of any 401 response, but the very first render
 * before any API call has fired needs its own redirect once useSession()
 * itself resolves account: null.
 */
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useSession } from "../../hooks/useSession";
import { LOGIN_PATH, PUBLIC_PATHS } from "../../lib/api/http";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, loading } = useSession();

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isPublicPage && !loading && !account) {
      router.replace(LOGIN_PATH);
    }
  }, [isPublicPage, loading, account, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (loading || !account) {
    // Loading, or redirecting to /entrar (above) — render nothing rather
    // than flash protected content or a half-built shell.
    return null;
  }

  return (
    <div className="flex min-h-full">
      <Sidebar
        role={account.account_type}
        userName={account.name}
        roleLabel=""
        activeHref={pathname}
        onNavigate={(href) => router.push(href)}
      />
      <div className="flex flex-1 flex-col">
        <Topbar userName={account.name} onCreateEvent={() => router.push("/eventos/novo")} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
