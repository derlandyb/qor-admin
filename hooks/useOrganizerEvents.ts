import { useCallback, useEffect, useState } from "react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { CreateEventPayload, EditEventPayload, QorEvent } from "@/lib/api/types";

const UNEXPECTED_ERROR_MESSAGE = "Ocorreu um erro inesperado.";

/**
 * Fetches the organizer's own events on mount and exposes CRUD + workflow
 * actions that keep the local `events` list in sync with the server after
 * each successful call — no manual reload needed. Actions never rethrow;
 * on failure they set `error` (pt-BR) and resolve with `undefined`, leaving
 * `events` untouched.
 */
export function useOrganizerEvents() {
  const [events, setEvents] = useState<QorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.events.list();
      setEvents(response.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refetch();
    })();
  }, [refetch]);

  const create = useCallback(async (payload: CreateEventPayload): Promise<QorEvent | undefined> => {
    setError(null);
    try {
      const response = await apiClient.events.create(payload);
      setEvents((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
      return undefined;
    }
  }, []);

  const update = useCallback(
    async (id: number, payload: EditEventPayload): Promise<QorEvent | undefined> => {
      setError(null);
      try {
        const response = await apiClient.events.update(id, payload);
        setEvents((prev) => prev.map((event) => (event.id === id ? response.data : event)));
        return response.data;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
        setError(message);
        return undefined;
      }
    },
    [],
  );

  const submit = useCallback(async (id: number): Promise<QorEvent | undefined> => {
    setError(null);
    try {
      const response = await apiClient.events.submit(id);
      setEvents((prev) => prev.map((event) => (event.id === id ? response.data : event)));
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
      return undefined;
    }
  }, []);

  const duplicate = useCallback(async (id: number): Promise<QorEvent | undefined> => {
    setError(null);
    try {
      const response = await apiClient.events.duplicate(id);
      setEvents((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
      return undefined;
    }
  }, []);

  const cancel = useCallback(async (id: number): Promise<QorEvent | undefined> => {
    setError(null);
    try {
      const response = await apiClient.events.cancel(id);
      setEvents((prev) => prev.map((event) => (event.id === id ? response.data : event)));
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
      return undefined;
    }
  }, []);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setError(null);
    try {
      await apiClient.events.remove(id);
      setEvents((prev) => prev.filter((event) => event.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
      setError(message);
      return false;
    }
  }, []);

  return { events, isLoading, error, create, update, submit, duplicate, cancel, remove, refetch };
}
