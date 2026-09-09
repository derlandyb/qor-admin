"use client";

/**
 * Super Admin create-genre page, mirrors app/planos/novo/page.tsx.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GenreForm } from "../../../components/design-system/GenreForm";
import { useGenres } from "../../../hooks/useGenres";
import type { GenrePayload } from "../../../lib/api/client";

export default function NewGenrePage() {
  const router = useRouter();
  const { create } = useGenres();
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: GenrePayload) {
    setFormError(null);
    try {
      await create(values);
      router.push("/generos");
    } catch {
      setFormError("Erro ao criar o gênero.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Novo Gênero</h1>

      {formError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {formError}
        </p>
      )}

      <GenreForm onSubmit={handleSubmit} submitLabel="Criar Gênero" />
    </div>
  );
}
