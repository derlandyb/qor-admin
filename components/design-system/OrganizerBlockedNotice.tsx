/**
 * AT20 — pt-BR notice shown instead of the event list/create UI when an
 * organizer's own account is not yet `approved` (ADMIN-03). Shared between
 * app/eventos/page.tsx and app/eventos/novo/page.tsx.
 */
export function OrganizerBlockedNotice() {
  return (
    <p
      role="status"
      className="rounded-admin-default bg-admin-warning/15 px-3 py-2 text-sm text-admin-warning"
    >
      Sua conta ainda está em análise. Você poderá criar eventos após a aprovação.
    </p>
  );
}
