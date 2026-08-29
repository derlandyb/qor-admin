import type { ReactNode } from "react";

/**
 * A single column definition for DataTable. Callers own the shape of `T`
 * and decide what each column renders — DataTable itself never hardcodes
 * domain columns (design-system-admin.md §5.6).
 */
export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  actions?: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, actions }: DataTableProps<T>) {
  const columnCount = columns.length + (actions ? 1 : 0);

  return (
    <table className="w-full border-collapse text-admin-body">
      <thead>
        <tr className="border-b border-admin-border-subtle">
          {columns.map((column) => (
            <th
              key={column.header}
              className="px-4 py-3 text-left text-admin-text-secondary font-medium"
            >
              {column.header}
            </th>
          ))}
          {actions ? (
            <th className="px-4 py-3 text-left text-admin-text-secondary font-medium">Ações</th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={Math.max(columnCount, 1)}
              className="px-4 py-6 text-center text-admin-text-secondary"
            >
              Nenhum item encontrado.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-admin-border-subtle">
              {columns.map((column) => (
                <td key={column.header} className="px-4 py-3 text-admin-text-primary">
                  {column.render(row)}
                </td>
              ))}
              {actions ? <td className="px-4 py-3">{actions(row)}</td> : null}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
