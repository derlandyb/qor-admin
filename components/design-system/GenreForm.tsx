"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "./Field";
import { Button } from "./Button";
import { validateGenreFields } from "./form-validation";
import type { GenrePayload } from "../../lib/api/client";

const DEFAULT_DRAFT: GenrePayload = {
  name: "",
};

export interface GenreFormProps {
  initialValues?: Partial<GenrePayload>;
  onSubmit: (values: GenrePayload) => void;
  submitLabel?: string;
}

export function GenreForm({ initialValues, onSubmit, submitLabel = "Salvar" }: GenreFormProps) {
  const [values, setValues] = useState<GenrePayload>({ ...DEFAULT_DRAFT, ...initialValues });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateGenreFields(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        id="genre-name"
        label="Nome"
        value={values.name}
        error={errors.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
