/**
 * Thin hook wrapping the Genre endpoints (lib/api/client.ts's
 * listGenres/createGenre/updateGenre/activateGenre/deactivateGenre),
 * mirroring useBilling.ts's usePlans() fetch-on-mount/refetch-after-mutation
 * shape (Super Admin CRUD), extended with both activate and deactivate since
 * Genre needs both directions unlike Plan (deactivate-only).
 */
import { useCallback, useEffect, useState } from "react";
import {
  activateGenre,
  createGenre,
  deactivateGenre,
  listGenres,
  updateGenre,
  type GenrePayload,
} from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Genre } from "../lib/api/types";

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : "Erro inesperado.";
}

export interface Genres {
  genres: Genre[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (payload: GenrePayload) => Promise<Genre>;
  update: (id: number, payload: GenrePayload) => Promise<Genre>;
  activate: (id: number) => Promise<Genre>;
  deactivate: (id: number) => Promise<Genre>;
}

export function useGenres(): Genres {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listGenres();
      setGenres(result.data);
    } catch (err) {
      setError(messageOf(err));
      setGenres([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (payload: GenrePayload) => {
      const result = await createGenre(payload);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const update = useCallback(
    async (id: number, payload: GenrePayload) => {
      const result = await updateGenre(id, payload);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const activate = useCallback(
    async (id: number) => {
      const result = await activateGenre(id);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const deactivate = useCallback(
    async (id: number) => {
      const result = await deactivateGenre(id);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  return { genres, loading, error, refetch, create, update, activate, deactivate };
}
