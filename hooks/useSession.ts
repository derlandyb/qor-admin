/**
 * Role-aware session hook wrapping the newly-added lib/api/client.ts
 * getMe/getVenueProfile/getPromoterProfile endpoints. Fetches on mount:
 * `getMe()` first, then — depending on `account_type` — the matching
 * profile endpoint, so venue/promoter dashboards get their own record for
 * free alongside the session identity.
 *
 * A 401 from `getMe()` (an `UnauthenticatedError`, per lib/api/http.ts) is
 * the expected steady state for an unauthenticated visitor (e.g. landing on
 * /entrar) — `apiRequest()` already redirects to /entrar as a side effect of
 * that 401, so this hook must not ALSO surface it as a scary `error` string
 * or leave an uncaught rejection; it just resolves to `account: null` and
 * `loading: false`. Any other failure (network error, 500, etc.) is surfaced
 * via `error` the same way the other hooks in this folder do.
 */
import { useCallback, useEffect, useState } from "react";
import { getMe, getPromoterProfile, getVenueProfile } from "../lib/api/client";
import { ApiError, UnauthenticatedError } from "../lib/api/http";
import type { AdminSessionAccount, Promoter, Venue } from "../lib/api/types";

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : "Erro inesperado.";
}

export interface Session {
  account: AdminSessionAccount | null;
  venue: Venue | null;
  promoter: Promoter | null;
  loading: boolean;
  error: string | null;
}

export function useSession(): Session {
  const [account, setAccount] = useState<AdminSessionAccount | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAccount(null);
    setVenue(null);
    setPromoter(null);
    try {
      const me = await getMe();
      setAccount(me.data);

      if (me.data.account_type === "venue_admin") {
        const venueProfile = await getVenueProfile();
        setVenue(venueProfile.data);
      } else if (me.data.account_type === "promoter") {
        const promoterProfile = await getPromoterProfile();
        setPromoter(promoterProfile.data);
      }
    } catch (err) {
      // An unauthenticated visitor is an expected, non-alarming state (the
      // 401 has already triggered a redirect to /entrar in http.ts) — leave
      // account/venue/promoter null and error unset.
      if (!(err instanceof UnauthenticatedError)) {
        setError(messageOf(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { account, venue, promoter, loading, error };
}
