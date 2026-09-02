"use client";

import { useState, type FormEvent } from "react";
import { TextField, TextAreaField, SelectField } from "./Field";
import { Button } from "./Button";
import { CITY_VALUES, CITY_LABELS } from "../../lib/enums/city";
import { validateEventFields } from "./form-validation";
import type { CreateEventFields } from "../../lib/api/client";

const CITY_OPTIONS = CITY_VALUES.map((value) => ({ value, label: CITY_LABELS[value] }));

export type EventFormDraft = Omit<CreateEventFields, "cover_image" | "promoter_ids"> & {
  cover_image?: File;
};

const DEFAULT_DRAFT: EventFormDraft = {
  title: "",
  description: "",
  starts_at: "",
  city: "vitoria",
  genre_id: 0,
  is_free: false,
  address: "",
  ticket_url: "",
  capacity: null,
  age_rating: "",
  notes: "",
};

export interface EventFormProps {
  initialValues?: Partial<EventFormDraft>;
  onSubmit: (values: EventFormDraft) => void;
  submitLabel?: string;
}

/**
 * design-system-admin.md §5.8 — field set from api's CreateEventRequest
 * (EventController::store). ticket_url is required only when !is_free, per
 * ADMIN-11/ADMIN-12. Genre is a DB-backed lookup table (ARCHITECTURE §14.1),
 * so this form takes a raw genre_id for now — NOT because AT12's hooks
 * were missing (they landed in this same PR), but because qor-api has no
 * genre-list endpoint at all yet (neither /api/v1 nor /api/admin/v1) for
 * a picker to fetch from. A real picker needs that endpoint built first —
 * flagged in .specs/project/STATE.md's Todos.
 */
export function EventForm({ initialValues, onSubmit, submitLabel = "Salvar" }: EventFormProps) {
  const [values, setValues] = useState<EventFormDraft>({ ...DEFAULT_DRAFT, ...initialValues });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateEventFields(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        id="event-title"
        label="Título"
        value={values.title}
        error={errors.title}
        onChange={(e) => setValues({ ...values, title: e.target.value })}
      />
      <TextAreaField
        id="event-description"
        label="Descrição"
        value={values.description}
        error={errors.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
      />
      <TextField
        id="event-starts-at"
        label="Data e hora"
        type="datetime-local"
        value={values.starts_at}
        error={errors.starts_at}
        onChange={(e) => setValues({ ...values, starts_at: e.target.value })}
      />
      <SelectField
        id="event-city"
        label="Cidade"
        options={CITY_OPTIONS}
        value={values.city}
        error={errors.city}
        onChange={(e) => setValues({ ...values, city: e.target.value as typeof values.city })}
      />
      <TextField
        id="event-genre"
        label="Gênero"
        type="number"
        value={values.genre_id || ""}
        error={errors.genre_id}
        onChange={(e) => setValues({ ...values, genre_id: Number(e.target.value) })}
      />
      <TextField
        id="event-address"
        label="Endereço (opcional para eventos em locais cadastrados)"
        value={values.address ?? ""}
        onChange={(e) => setValues({ ...values, address: e.target.value })}
      />

      <label className="flex items-center gap-2 text-sm text-admin-text-secondary">
        <input
          type="checkbox"
          checked={values.is_free}
          onChange={(e) => setValues({ ...values, is_free: e.target.checked })}
          className="h-4 w-4 rounded-admin-input-select border border-white/10 bg-admin-bg-surface"
        />
        Evento gratuito
      </label>

      {!values.is_free && (
        <TextField
          id="event-ticket-url"
          label="Link do ingresso"
          value={values.ticket_url ?? ""}
          error={errors.ticket_url}
          onChange={(e) => setValues({ ...values, ticket_url: e.target.value })}
        />
      )}

      <TextField
        id="event-capacity"
        label="Capacidade (opcional)"
        type="number"
        value={values.capacity ?? ""}
        onChange={(e) =>
          setValues({ ...values, capacity: e.target.value ? Number(e.target.value) : null })
        }
      />
      <TextField
        id="event-age-rating"
        label="Classificação etária (opcional)"
        value={values.age_rating ?? ""}
        onChange={(e) => setValues({ ...values, age_rating: e.target.value })}
      />
      <TextAreaField
        id="event-notes"
        label="Notas (opcional)"
        value={values.notes ?? ""}
        onChange={(e) => setValues({ ...values, notes: e.target.value })}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="event-cover-image" className="text-sm text-admin-text-secondary">
          Imagem de capa (opcional)
        </label>
        <input
          id="event-cover-image"
          type="file"
          accept="image/*"
          onChange={(e) => setValues({ ...values, cover_image: e.target.files?.[0] })}
          className="text-sm text-admin-text-primary"
        />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
