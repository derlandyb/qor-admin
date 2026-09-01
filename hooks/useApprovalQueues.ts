/**
 * Thin React hooks wrapping the Super Admin approval-queue endpoints
 * (lib/api/client.ts's listPendingAccounts/decideAccountApproval and
 * listPendingEvents/decideEventApproval). Fetch on mount and whenever `page`
 * changes; `decide()` re-fetches the current page afterward so the queue
 * reflects the decision immediately (no optimistic removal).
 */
import { useCallback, useEffect, useState } from "react";
import {
  decideAccountApproval,
  decideEventApproval,
  listPendingAccounts,
  listPendingEvents,
  type DecideApprovalPayload,
  type DecideEventApprovalPayload,
} from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Event, PendingAccount } from "../lib/api/types";
import type { ApprovalDecidableType } from "../lib/enums/approval";

function totalPagesOf(total: number, perPage: number): number {
  return perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1;
}

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : "Erro inesperado.";
}

export interface AccountApprovalQueue {
  accounts: PendingAccount[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  refetch: () => Promise<void>;
  decide: (
    accountType: ApprovalDecidableType,
    id: number,
    payload: DecideApprovalPayload,
  ) => Promise<void>;
  setPage: (page: number) => void;
}

export function useAccountApprovalQueue(): AccountApprovalQueue {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPendingAccounts(page);
      setAccounts(result.data);
      setTotalPages(totalPagesOf(result.total, result.per_page));
    } catch (err) {
      setError(messageOf(err));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Fetch-on-mount/page-change is the intended synchronization with the
  // server-owned approval queue (not derivable from props/state), so the
  // resulting setState calls inside `refetch` are the correct, idiomatic
  // shape here despite the compiler's generic cascading-render warning.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const decide = useCallback(
    async (accountType: ApprovalDecidableType, id: number, payload: DecideApprovalPayload) => {
      await decideAccountApproval(accountType, id, payload);
      await refetch();
    },
    [refetch],
  );

  return { accounts, loading, error, page, totalPages, refetch, decide, setPage };
}

export interface EventApprovalQueue {
  events: Event[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  refetch: () => Promise<void>;
  decide: (id: number, payload: DecideEventApprovalPayload) => Promise<void>;
  setPage: (page: number) => void;
}

export function useEventApprovalQueue(): EventApprovalQueue {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPendingEvents(page);
      setEvents(result.data);
      setTotalPages(totalPagesOf(result.total, result.per_page));
    } catch (err) {
      setError(messageOf(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // See the account-queue hook above for why this setState-in-effect is intentional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const decide = useCallback(
    async (id: number, payload: DecideEventApprovalPayload) => {
      await decideEventApproval(id, payload);
      await refetch();
    },
    [refetch],
  );

  return { events, loading, error, page, totalPages, refetch, decide, setPage };
}
