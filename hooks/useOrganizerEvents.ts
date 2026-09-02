/**
 * Thin hook wrapping the organizer event-CRUD endpoints (lib/api/client.ts's
 * listEvents/createEvent/editEvent/submitEventForReview/duplicateEvent/
 * cancelEvent/deleteEvent). Fetches on mount like useApprovalQueues.ts; every
 * mutation re-fetches the list afterward so it stays in sync with the server
 * (no optimistic updates), mirroring that hook's `decide()` pattern.
 */
import { useCallback, useEffect, useState } from "react";
import {
  cancelEvent,
  createEvent,
  deleteEvent,
  duplicateEvent,
  editEvent,
  listEvents,
  submitEventForReview,
  type CreateEventFields,
  type EditEventFields,
} from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Event } from "../lib/api/types";

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : "Erro inesperado.";
}

export interface OrganizerEvents {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (fields: CreateEventFields) => Promise<Event>;
  edit: (id: number, fields: EditEventFields) => Promise<Event>;
  submit: (id: number) => Promise<Event>;
  duplicate: (id: number, startsAt: string) => Promise<Event>;
  cancel: (id: number) => Promise<Event>;
  remove: (id: number) => Promise<void>;
}

export function useEvents(): OrganizerEvents {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listEvents();
      setEvents(result.data);
    } catch (err) {
      setError(messageOf(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount is the intended synchronization with the server-owned
  // event list (not derivable from props/state), same rationale as
  // useApprovalQueues.ts's hooks.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (fields: CreateEventFields) => {
      const result = await createEvent(fields);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const edit = useCallback(
    async (id: number, fields: EditEventFields) => {
      const result = await editEvent(id, fields);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const submit = useCallback(
    async (id: number) => {
      const result = await submitEventForReview(id);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const duplicate = useCallback(
    async (id: number, startsAt: string) => {
      const result = await duplicateEvent(id, startsAt);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const cancel = useCallback(
    async (id: number) => {
      const result = await cancelEvent(id);
      await refetch();
      return result.data;
    },
    [refetch],
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteEvent(id);
      await refetch();
    },
    [refetch],
  );

  return { events, loading, error, refetch, create, edit, submit, duplicate, cancel, remove };
}
