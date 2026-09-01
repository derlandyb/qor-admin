/**
 * Thin mutation hooks wrapping the venue/promoter self-registration endpoints
 * (lib/api/client.ts's registerVenue/registerPromoter). No fetch-on-mount —
 * `register()` sets `loading` for the duration of the call, returns the
 * created record on success (the page decides what to do with it — show a
 * confirmation, redirect, etc.), and on failure sets `error` to the failure's
 * message AND re-throws so the caller can also react synchronously (e.g. to
 * keep focus on an invalid field) without having to poll `error`.
 */
import { useCallback, useState } from "react";
import {
  registerPromoter,
  registerVenue,
  type RegisterPromoterPayload,
  type RegisterVenuePayload,
} from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Promoter, Venue } from "../lib/api/types";

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : "Erro inesperado.";
}

export interface VenueRegistration {
  register: (payload: RegisterVenuePayload) => Promise<Venue>;
  loading: boolean;
  error: string | null;
}

export function useVenueRegistration(): VenueRegistration {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (payload: RegisterVenuePayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerVenue(payload);
      return result.data;
    } catch (err) {
      setError(messageOf(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}

export interface PromoterRegistration {
  register: (payload: RegisterPromoterPayload) => Promise<Promoter>;
  loading: boolean;
  error: string | null;
}

export function usePromoterRegistration(): PromoterRegistration {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (payload: RegisterPromoterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerPromoter(payload);
      return result.data;
    } catch (err) {
      setError(messageOf(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}
