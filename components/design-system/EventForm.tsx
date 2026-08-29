"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { City, CityLabel } from "@/lib/enums";
import type { CreateEventPayload, EditEventPayload } from "@/lib/api/types";

/**
 * Shared input/select/checkbox styling (design-system-admin.md §5.8) —
 * mirrors RegistrationForm.tsx's tokens so both forms read as one system.
 */
const INPUT_CLASS =
  "w-full bg-admin-bg-surface border border-admin-border-subtle rounded-admin-input px-5 pt-[13px] pb-[11px] text-sm text-admin-text-primary placeholder:text-admin-text-secondary transition-[border-color,box-shadow] duration-admin-control ease-admin-control focus:outline-none focus:border-admin-primary focus:shadow-[0_0_0_2px_rgba(0,144,231,0.25)]";

const SELECT_CLASS =
  "w-full bg-admin-bg-surface border border-admin-border-subtle rounded-admin-select px-5 pt-[13px] pb-[11px] text-sm text-admin-text-primary transition-[border-color,box-shadow] duration-admin-control ease-admin-control focus:outline-none focus:border-admin-primary focus:shadow-[0_0_0_2px_rgba(0,144,231,0.25)]";

const CHECKBOX_CLASS =
  "h-4 w-4 rounded-admin-checkbox border border-admin-border-subtle bg-white text-admin-primary";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-admin-text-secondary">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface FormState {
  title: string;
  description: string;
  starts_at: string;
  city: City | "";
  genre_id: string;
  is_free: boolean;
  ticket_url: string;
  capacity: string;
  age_rating: string;
  notes: string;
  cover_image: File | null;
}

function toDatetimeLocalValue(value?: string | null): string {
  if (!value) {
    return "";
  }
  // datetime-local expects "YYYY-MM-DDTHH:mm"; trim seconds/timezone if present.
  return value.slice(0, 16);
}

function buildInitialState(initialValues?: Partial<CreateEventPayload>): FormState {
  return {
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    starts_at: toDatetimeLocalValue(initialValues?.starts_at),
    city: initialValues?.city ?? "",
    genre_id: initialValues?.genre_id != null ? String(initialValues.genre_id) : "",
    is_free: initialValues?.is_free ?? false,
    ticket_url: initialValues?.ticket_url ?? "",
    capacity: initialValues?.capacity != null ? String(initialValues.capacity) : "",
    age_rating: initialValues?.age_rating ?? "",
    notes: initialValues?.notes ?? "",
    cover_image: null,
  };
}

type FieldErrors = Partial<
  Record<"title" | "description" | "starts_at" | "city" | "genre_id" | "ticket_url", string>
>;

function validate(mode: "create" | "edit", state: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (mode === "create") {
    if (!state.title.trim()) {
      errors.title = "O título é obrigatório.";
    }
    if (!state.description.trim()) {
      errors.description = "A descrição é obrigatória.";
    }
    if (!state.starts_at.trim()) {
      errors.starts_at = "A data de início é obrigatória.";
    }
    if (!state.city) {
      errors.city = "A cidade é obrigatória.";
    }
    if (!state.genre_id.trim()) {
      errors.genre_id = "O gênero é obrigatório.";
    }
  }

  // Conditional-required rule applies in both modes: whenever the current
  // form state has is_free === false, a ticket_url is required.
  if (!state.is_free && !state.ticket_url.trim()) {
    errors.ticket_url = "Eventos pagos precisam de um link de ingresso.";
  }

  return errors;
}

export interface EventFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<CreateEventPayload>;
  onSubmit: (payload: CreateEventPayload | EditEventPayload) => void | Promise<void>;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function EventForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}: EventFormProps) {
  const [state, setState] = useState<FormState>(() => buildInitialState(initialValues));
  const [errors, setErrors] = useState<FieldErrors>({});

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setState((previous) => ({ ...previous, [field]: value }));
  }

  function handleTextChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateField(field, event.target.value as FormState[typeof field]);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fieldErrors = validate(mode, state);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    const payload: CreateEventPayload | EditEventPayload = {
      ...(state.title.trim() ? { title: state.title } : {}),
      ...(state.description.trim() ? { description: state.description } : {}),
      ...(state.starts_at.trim() ? { starts_at: state.starts_at } : {}),
      ...(state.city ? { city: state.city as City } : {}),
      ...(state.genre_id.trim() ? { genre_id: Number(state.genre_id) } : {}),
      is_free: state.is_free,
      ticket_url: state.ticket_url ? state.ticket_url : null,
      capacity: state.capacity.trim() ? Number(state.capacity) : null,
      age_rating: state.age_rating.trim() ? state.age_rating : null,
      notes: state.notes.trim() ? state.notes : null,
      cover_image: state.cover_image,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError ? (
        <p role="alert" className="text-sm text-admin-danger">
          {serverError}
        </p>
      ) : null}

      <Field id="title" label="Título" error={errors.title}>
        <input
          id="title"
          type="text"
          className={INPUT_CLASS}
          value={state.title}
          onChange={handleTextChange("title")}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
      </Field>

      <Field id="description" label="Descrição" error={errors.description}>
        <textarea
          id="description"
          className={INPUT_CLASS}
          rows={4}
          value={state.description}
          onChange={handleTextChange("description")}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
      </Field>

      <Field id="starts_at" label="Data de início" error={errors.starts_at}>
        <input
          id="starts_at"
          type="datetime-local"
          className={INPUT_CLASS}
          value={state.starts_at}
          onChange={handleTextChange("starts_at")}
          aria-invalid={Boolean(errors.starts_at)}
          aria-describedby={errors.starts_at ? "starts_at-error" : undefined}
        />
      </Field>

      <Field id="city" label="Cidade" error={errors.city}>
        <select
          id="city"
          className={SELECT_CLASS}
          value={state.city}
          onChange={handleTextChange("city")}
          aria-invalid={Boolean(errors.city)}
          aria-describedby={errors.city ? "city-error" : undefined}
        >
          <option value="">Selecione</option>
          {Object.values(City).map((cityValue) => (
            <option key={cityValue} value={cityValue}>
              {CityLabel[cityValue]}
            </option>
          ))}
        </select>
      </Field>

      {/*
        Plain numeric field — there is no genre lookup endpoint wired up yet
        (Genre is a DB-backed lookup per ARCHITECTURE.md §14). Replace with a
        <select> populated from a genres endpoint once one exists.
      */}
      <Field id="genre_id" label="Gênero (ID)" error={errors.genre_id}>
        <input
          id="genre_id"
          type="number"
          min={1}
          className={INPUT_CLASS}
          value={state.genre_id}
          onChange={handleTextChange("genre_id")}
          aria-invalid={Boolean(errors.genre_id)}
          aria-describedby={errors.genre_id ? "genre_id-error" : undefined}
        />
      </Field>

      <div className="flex items-center gap-2">
        <input
          id="is_free"
          type="checkbox"
          className={CHECKBOX_CLASS}
          checked={state.is_free}
          onChange={(event) => updateField("is_free", event.target.checked)}
        />
        <label htmlFor="is_free" className="text-sm text-admin-text-secondary">
          Evento gratuito
        </label>
      </div>

      <Field id="ticket_url" label="Link de ingresso" error={errors.ticket_url}>
        <input
          id="ticket_url"
          type="text"
          className={INPUT_CLASS}
          value={state.ticket_url}
          onChange={handleTextChange("ticket_url")}
          aria-invalid={Boolean(errors.ticket_url)}
          aria-describedby={errors.ticket_url ? "ticket_url-error" : undefined}
        />
      </Field>

      <Field id="capacity" label="Capacidade (opcional)">
        <input
          id="capacity"
          type="number"
          min={0}
          className={INPUT_CLASS}
          value={state.capacity}
          onChange={handleTextChange("capacity")}
        />
      </Field>

      <Field id="age_rating" label="Classificação etária (opcional)">
        <input
          id="age_rating"
          type="text"
          className={INPUT_CLASS}
          value={state.age_rating}
          onChange={handleTextChange("age_rating")}
        />
      </Field>

      <Field id="notes" label="Observações (opcional)">
        <textarea
          id="notes"
          className={INPUT_CLASS}
          rows={3}
          value={state.notes}
          onChange={handleTextChange("notes")}
        />
      </Field>

      <Field id="cover_image" label="Imagem de capa (opcional)">
        <input
          id="cover_image"
          type="file"
          accept="image/*"
          className={INPUT_CLASS}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateField("cover_image", event.target.files?.[0] ?? null)
          }
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-admin-button bg-admin-primary px-5 py-2.5 text-sm font-medium text-white transition-[background-color] duration-admin-control ease-admin-control disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : mode === "create" ? "Criar evento" : "Salvar alterações"}
      </button>
    </form>
  );
}
