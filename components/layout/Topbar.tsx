export interface TopbarProps {
  onCreateEvent?: () => void;
  userName: string;
}

/**
 * design-system-admin.md §5.2 — search input, primary CTA, icon buttons,
 * profile block. No transition classes anywhere here per §4 (instant snap).
 */
export function Topbar({ onCreateEvent, userName }: TopbarProps) {
  return (
    <header className="flex items-center gap-4 border-b border-white/10 bg-admin-bg-surface px-4 py-3 text-admin-text-primary">
      <input
        type="search"
        placeholder="Buscar"
        aria-label="Buscar"
        className="min-w-0 flex-1 max-w-xs rounded-admin-pill border border-white/10 bg-admin-bg-body px-4 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted focus:outline-none"
      />

      <button
        type="button"
        onClick={onCreateEvent}
        className="ml-auto shrink-0 rounded-admin-pill bg-admin-primary px-5 py-2 text-sm font-medium text-white hover:bg-admin-primary/85"
      >
        + Novo Evento
      </button>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Notificações"
          className="rounded-admin-default p-2 text-admin-text-muted hover:text-admin-text-primary"
        >
          <span aria-hidden>🔔</span>
        </button>
        <div className="flex items-center gap-2">
          <div
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-primary text-sm font-bold text-white"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm">{userName}</span>
        </div>
      </div>
    </header>
  );
}
