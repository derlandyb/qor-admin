import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTable, type Column } from "../DataTable";

interface Row {
  id: number;
  name: string;
}

const columns: Column<Row>[] = [
  { header: "Nome", render: (row) => row.name },
];

describe("DataTable", () => {
  test("GIVEN rows WHEN DataTable renders THEN it shows a cell per row per column", () => {
    const rows: Row[] = [
      { id: 1, name: "Casa Rosa" },
      { id: 2, name: "Clube Azul" },
    ];

    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByText("Casa Rosa")).toBeInTheDocument();
    expect(screen.getByText("Clube Azul")).toBeInTheDocument();
    expect(screen.getByText("Nome")).toBeInTheDocument();
  });

  test("GIVEN no rows WHEN DataTable renders THEN it shows the empty state message", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} />);

    expect(screen.getByText("Nenhum item encontrado.")).toBeInTheDocument();
  });

  test("GIVEN an actions renderer WHEN a row action is clicked THEN its callback fires with that row", async () => {
    const user = userEvent.setup();
    const onApprove = jest.fn();
    const rows: Row[] = [{ id: 1, name: "Casa Rosa" }];

    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        actions={(row) => (
          <button type="button" onClick={() => onApprove(row)}>
            Aprovar
          </button>
        )}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(onApprove).toHaveBeenCalledWith(rows[0]);
  });
});
