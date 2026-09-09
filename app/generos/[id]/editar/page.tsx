"use client";

/**
 * Super Admin edit-genre page. Same Next 16 async `params` resolution
 * pattern as app/planos/[id]/editar/page.tsx (see that file's docblock). No
 * single-genre GET endpoint exists — the genre to edit is found in
 * useGenres().genres by id.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GenreForm } from "../../../../components/design-system/GenreForm";
import { useGenres } from "../../../../hooks/useGenres";
import type { GenrePayload } from "../../../../lib/api/client";

interface EditGenrePageProps {
  params: Promise<{ id: string }>;
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <p className="text-sm text-admin-text-secondary">Carregando...</p>
    </div>
  );
}

export default function EditGenrePage({ params }: EditGenrePageProps) {
  const router = useRouter();
  const { genres, loading: genresLoading, error, update } = useGenres();
  const [id, setId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    params.then((resolved) => {
      if (active) setId(resolved.id);
    });
    return () => {
      active = false;
    };
  }, [params]);

  const genre = id === null ? undefined : genres.find((g) => String(g.id) === id);

  async function handleSubmit(values: GenrePayload) {
    if (id === null) return;
    setFormError(null);
    try {
      await update(Number(id), values);
      router.push("/generos");
    } catch {
      setFormError("Erro ao salvar o gênero.");
    }
  }

  if (id === null || genresLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p className="text-sm text-admin-text-secondary">Gênero não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Editar Gênero</h1>

      {formError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {formError}
        </p>
      )}

      <GenreForm
        initialValues={{ name: genre.name }}
        onSubmit={handleSubmit}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}
