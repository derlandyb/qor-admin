import { useCallback, useState } from "react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { Promoter, RegisterPromoterPayload, RegisterVenuePayload, Venue } from "@/lib/api/types";

const UNEXPECTED_ERROR_MESSAGE = "Ocorreu um erro inesperado.";

/**
 * `register` never rethrows. On success it resolves with the created record;
 * on failure it sets `error` (pt-BR, from `ApiError.message`) and resolves
 * with `undefined` instead of rejecting. The two signals are not dual — a
 * caller either awaits the returned promise and checks for `undefined`, or
 * ignores the resolved value and reads `error` state after the call. Pick
 * one pattern per call site and stay consistent; both observe the same
 * outcome, just via different mechanisms.
 */

export function useVenueRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (payload: RegisterVenuePayload): Promise<Venue | undefined> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.venues.register(payload);
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { register, isSubmitting, error };
}

export function usePromoterRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (payload: RegisterPromoterPayload): Promise<Promoter | undefined> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.promoters.register(payload);
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { register, isSubmitting, error };
}
