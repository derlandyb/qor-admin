import { useCallback, useEffect, useState } from "react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { PendingAccount, QorEvent } from "@/lib/api/types";
import type { ApprovalOutcome } from "@/lib/enums";

const GENERIC_ERROR_MESSAGE = "Ocorreu um erro inesperado.";

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return GENERIC_ERROR_MESSAGE;
}

export interface UseAccountApprovalQueueResult {
  accounts: PendingAccount[];
  total: number;
  perPage: number;
  isLoading: boolean;
  error: string | null;
  decide: (accountType: string, id: number, outcome: ApprovalOutcome, reason?: string | null) => Promise<void>;
  refetch: () => void;
}

export function useAccountApprovalQueue(page = 1): UseAccountApprovalQueueResult {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.accountApprovals.list(page);
        if (cancelled) return;
        setAccounts(response.data);
        setTotal(response.total);
        setPerPage(response.per_page);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(toErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page, refetchToken]);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  const decide = useCallback(
    async (accountType: string, id: number, outcome: ApprovalOutcome, reason?: string | null) => {
      await apiClient.accountApprovals.decide(accountType, id, { outcome, reason });
      refetch();
    },
    [refetch],
  );

  return { accounts, total, perPage, isLoading, error, decide, refetch };
}

export interface UseEventApprovalQueueResult {
  events: QorEvent[];
  total: number;
  perPage: number;
  isLoading: boolean;
  error: string | null;
  decide: (id: number, outcome: ApprovalOutcome, feedback?: string | null) => Promise<void>;
  refetch: () => void;
}

export function useEventApprovalQueue(page = 1): UseEventApprovalQueueResult {
  const [events, setEvents] = useState<QorEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.eventApprovals.list(page);
        if (cancelled) return;
        setEvents(response.data);
        setTotal(response.total);
        setPerPage(response.per_page);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(toErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page, refetchToken]);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  const decide = useCallback(
    async (id: number, outcome: ApprovalOutcome, feedback?: string | null) => {
      await apiClient.eventApprovals.decide(id, { outcome, feedback });
      refetch();
    },
    [refetch],
  );

  return { events, total, perPage, isLoading, error, decide, refetch };
}
