import { useCallback, useEffect, useState } from "react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { Plan, PlanPayload, UsageSummary } from "@/lib/api/types";

const UNEXPECTED_ERROR_MESSAGE = "Ocorreu um erro inesperado.";

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return UNEXPECTED_ERROR_MESSAGE;
}

/**
 * Fetches the full plan list on mount and exposes Super Admin CRUD actions
 * that keep the local `plans` list in sync with the server after each
 * successful call — no manual reload needed. Actions never rethrow; on
 * failure they set `error` (pt-BR) and resolve with `undefined`, leaving
 * `plans` untouched.
 */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.plans.list();
      setPlans(response.data);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refetch();
    })();
  }, [refetch]);

  const create = useCallback(async (payload: PlanPayload): Promise<Plan | undefined> => {
    setError(null);
    try {
      const response = await apiClient.plans.create(payload);
      setPlans((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(toErrorMessage(err));
      return undefined;
    }
  }, []);

  const update = useCallback(async (id: number, payload: PlanPayload): Promise<Plan | undefined> => {
    setError(null);
    try {
      const response = await apiClient.plans.update(id, payload);
      setPlans((prev) => prev.map((plan) => (plan.id === id ? response.data : plan)));
      return response.data;
    } catch (err) {
      setError(toErrorMessage(err));
      return undefined;
    }
  }, []);

  const deactivate = useCallback(async (id: number): Promise<Plan | undefined> => {
    setError(null);
    try {
      const response = await apiClient.plans.deactivate(id);
      setPlans((prev) => prev.map((plan) => (plan.id === id ? response.data : plan)));
      return response.data;
    } catch (err) {
      setError(toErrorMessage(err));
      return undefined;
    }
  }, []);

  return { plans, isLoading, error, create, update, deactivate, refetch };
}

/**
 * Fetches the organizer's own subscription usage summary on mount. Plan
 * change/cancel are P2 (MON-19+) and intentionally out of scope here.
 */
export function useOrganizerSubscription() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.subscription.get();
      setUsage(response.data);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refetch();
    })();
  }, [refetch]);

  return { usage, isLoading, error, refetch };
}
