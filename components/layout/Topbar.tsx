"use client";

import { useState } from "react";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M12 3.5c-3 0-5 2.3-5 5.4v2.6c0 1-.4 1.9-1 2.6l-.6.7c-.6.7-.1 1.7.7 1.7h11.8c.8 0 1.3-1 .7-1.7l-.6-.7c-.6-.7-1-1.6-1-2.6V8.9c0-3-2-5.4-5-5.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 6.5l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M5 8.5l7 7 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export interface TopbarProps {
  userName: string;
  onCreateEvent?: () => void;
  onLogout?: () => void;
}

export function Topbar({ userName, onCreateEvent, onLogout }: TopbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-admin-border-subtle bg-admin-bg-surface px-6 py-3">
      <label className="relative flex w-full max-w-sm items-center">
        <span className="pointer-events-none absolute left-3 text-admin-text-secondary">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Buscar..."
          aria-label="Buscar"
          className="w-full rounded-admin-button-pill border border-admin-border-subtle bg-admin-bg-surface-alt py-2 pl-10 pr-4 text-admin-body text-admin-text-primary placeholder:text-admin-text-secondary outline-none transition-[color,background-color,border-color,box-shadow] duration-admin-control ease-admin-control focus:border-admin-primary"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCreateEvent}
          className="whitespace-nowrap rounded-admin-button-pill bg-admin-primary px-4 py-2 text-admin-body font-medium text-admin-text-primary transition-[color,background-color,border-color,box-shadow] duration-admin-control ease-admin-control hover:bg-admin-info"
        >
          + Novo Evento
        </button>

        <button
          type="button"
          aria-label="Mensagens"
          className="flex h-9 w-9 items-center justify-center rounded-full text-admin-text-secondary transition-[color,background-color,border-color,box-shadow] duration-admin-control ease-admin-control hover:bg-admin-bg-surface-alt hover:text-admin-text-primary"
        >
          <MailIcon />
        </button>

        <button
          type="button"
          aria-label="Notificações"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-admin-text-secondary transition-[color,background-color,border-color,box-shadow] duration-admin-control ease-admin-control hover:bg-admin-bg-surface-alt hover:text-admin-text-primary"
        >
          <BellIcon />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-admin-danger" aria-hidden="true" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((open) => !open)}
            className="flex items-center gap-2 rounded-admin-button-pill py-1.5 pl-1.5 pr-3 text-admin-body text-admin-text-primary transition-[color,background-color,border-color,box-shadow] duration-admin-control ease-admin-control hover:bg-admin-bg-surface-alt"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-primary text-xs font-medium uppercase text-admin-text-primary">
              {userName.charAt(0)}
            </span>
            <span>{userName}</span>
            <ChevronDownIcon />
          </button>

          {isProfileOpen && (
            <ul
              role="menu"
              className="absolute right-0 top-full z-10 mt-2 w-44 rounded-admin-card border border-admin-border-subtle bg-admin-bg-surface-alt py-2 text-admin-body shadow-lg"
            >
              <li role="none">
                <button
                  role="menuitem"
                  type="button"
                  className="block w-full px-4 py-2 text-left text-admin-text-secondary transition-[color,background-color] duration-admin-control ease-admin-control hover:bg-admin-bg-surface hover:text-admin-text-primary"
                >
                  Meu perfil
                </button>
              </li>
              <li role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={onLogout}
                  className="block w-full px-4 py-2 text-left text-admin-text-secondary transition-[color,background-color] duration-admin-control ease-admin-control hover:bg-admin-bg-surface hover:text-admin-text-primary"
                >
                  Sair
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
