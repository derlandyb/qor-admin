import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface DataTableAction<T> {
  label: string;
  onClick: (row: T) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  actions?: DataTableAction<T>[];
  emptyMessage?: string;
}

/**
 * design-system-admin.md §5.6 — header row (muted secondary text, medium
 * weight), plain body columns, a trailing action/status column. The one
 * reusable table+row-action component, parameterized for both approval
 * queues and the organizer event list (venue-promoter-admin/design.md).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  emptyMessage = "Nenhum registro encontrado.",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-admin-default bg-admin-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 font-medium text-admin-text-secondary"
              >
                {column.header}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 font-medium text-admin-text-secondary">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-6 text-center text-admin-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-white/5 last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-admin-text-primary">
                    {column.render(row)}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => action.onClick(row)}
                          className="rounded-admin-default px-2 py-1 text-xs font-medium text-admin-primary hover:bg-white/5"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
