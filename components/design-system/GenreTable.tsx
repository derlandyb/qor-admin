import { DataTable } from "./DataTable";
import { StatusPill } from "./StatusPill";
import type { Genre } from "../../lib/api/types";

export interface GenreTableProps {
  genres: Genre[];
  onEdit: (genre: Genre) => void;
  onActivate: (genre: Genre) => void;
  onDeactivate: (genre: Genre) => void;
}

/**
 * Mirrors PlanTable.tsx's shape, extended with both directions of the
 * status action (Genre isn't deactivate-only like Plan) — inline next to
 * the status pill, same as PlanTable does for its single Desativar action.
 */
export function GenreTable({ genres, onEdit, onActivate, onDeactivate }: GenreTableProps) {
  return (
    <DataTable<Genre>
      columns={[
        { key: "name", header: "Nome", render: (genre) => genre.name },
        { key: "slug", header: "Slug", render: (genre) => genre.slug },
        {
          key: "status",
          header: "Status",
          render: (genre) => (
            <div className="flex items-center gap-2">
              <StatusPill status={genre.is_active ? "active" : "inactive"} />
              <button
                type="button"
                onClick={() => (genre.is_active ? onDeactivate(genre) : onActivate(genre))}
                className={`rounded-admin-default px-2 py-1 text-xs font-medium hover:bg-white/5 ${
                  genre.is_active ? "text-admin-danger" : "text-admin-success"
                }`}
              >
                {genre.is_active ? "Desativar" : "Ativar"}
              </button>
            </div>
          ),
        },
      ]}
      rows={genres}
      rowKey={(genre) => genre.id}
      actions={[{ label: "Editar", onClick: onEdit }]}
      emptyMessage="Nenhum gênero cadastrado."
    />
  );
}
