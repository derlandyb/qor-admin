/**
 * Thin hooks wrapping the Plan/Subscription endpoints (lib/api/client.ts's
 * listPlans/createPlan/updatePlan/deactivatePlan and getSubscription).
 * `usePlans()` mirrors useApprovalQueues.ts's fetch-on-mount/refetch-after-
 * mutation shape (Super Admin CRUD); `useOrganizerSubscription()` mirrors
 * useSession.ts's single-resource fetch-on-mount shape (any organizer's own
 * usage summary).
 */
import { useCallback, useEffect, useState } from "react";
import {
  createPlan,
  deactivatePlan,
  getSubscription,
  listPlans,
  updatePlan,
  type PlanPayload,
} from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Plan, UsageSummary } from "../lib/api/types";

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : "Erro inesperado.";
}

export interface Plans {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (payload: PlanPayload) => Promise<Plan>;
  update: (id: number, payload: PlanPayload) => Promise<Plan>;
  deactivate: (id: number) => Promise<Plan>;
}

export function usePlans(): Plans {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPlans();
      setPlans(result.data);
    } catch (err) {
      setError(messageOf(err));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount is the intended synchronization with the server-owned
  // plan list (not derivable from props/state), same rationale as
  // useApprovalQueues.ts's hooks.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (payload: PlanPayload) => {
      const result = await createPlan(payload);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const update = useCallback(
    async (id: number, payload: PlanPayload) => {
      const result = await updatePlan(id, payload);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const deactivate = useCallback(
    async (id: number) => {
      const result = await deactivatePlan(id);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  return { plans, loading, error, refetch, create, update, deactivate };
}

export interface OrganizerSubscription {
  usage: UsageSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrganizerSubscription(): OrganizerSubscription {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSubscription();
      setUsage(result.data);
    } catch (err) {
      setError(messageOf(err));
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { usage, loading, error, refetch };
}
