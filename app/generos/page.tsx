"use client";

/**
 * Super Admin genre list — mirrors app/planos/page.tsx's shape. Genre needs
 * both activate and deactivate (unlike Plan's deactivate-only flow), so both
 * go through DecisionModal for a confirm step.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/design-system/Button";
import { DecisionModal } from "../../components/design-system/DecisionModal";
import { GenreTable } from "../../components/design-system/GenreTable";
import { useGenres } from "../../hooks/useGenres";
import type { Genre } from "../../lib/api/types";

type PendingAction = { genre: Genre; kind: "activate" | "deactivate" };

export default function GenresPage() {
  const router = useRouter();
  const { genres, loading, error, activate, deactivate } = useGenres();
  const [pending, setPending] = useState<PendingAction | null>(null);

  async function handleConfirm() {
    if (!pending) return;
    const { genre, kind } = pending;
    setPending(null);
    if (kind === "activate") {
      await activate(genre.id);
    } else {
      await deactivate(genre.id);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text-primary">Gêneros</h1>
          <p className="mt-1 text-sm text-admin-text-secondary">
            Gerencie os gêneros musicais disponíveis para cadastro de eventos.
          </p>
        </div>
        <Button onClick={() => router.push("/generos/novo")}>Novo Gênero</Button>
      </div>

      {error && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-admin-text-secondary">Carregando...</p>
      ) : (
        <GenreTable
          genres={genres}
          onEdit={(genre) => router.push(`/generos/${genre.id}/editar`)}
          onActivate={(genre) => setPending({ genre, kind: "activate" })}
          onDeactivate={(genre) => setPending({ genre, kind: "deactivate" })}
        />
      )}

      <DecisionModal
        open={pending !== null}
        title={
          pending?.kind === "activate"
            ? `Ativar ${pending.genre.name}?`
            : `Desativar ${pending?.genre.name ?? ""}?`
        }
        description={
          pending?.kind === "activate"
            ? "O gênero volta a ficar disponível para cadastro de novos eventos."
            : "O gênero deixa de ficar disponível para cadastro de novos eventos; eventos existentes não são afetados."
        }
        confirmLabel={pending?.kind === "activate" ? "Ativar" : "Desativar"}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
