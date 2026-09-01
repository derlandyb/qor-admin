import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./DataTable";

interface Row {
  id: number;
  name: string;
}

describe("DataTable", () => {
  const columns = [{ key: "name", header: "Nome", render: (row: Row) => row.name }];
  const rows: Row[] = [
    { id: 1, name: "Casa de Shows" },
    { id: 2, name: "DJ Promo" },
  ];

  test("GIVEN rows WHEN it renders THEN each row's cell content appears", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByText("Casa de Shows")).toBeInTheDocument();
    expect(screen.getByText("DJ Promo")).toBeInTheDocument();
  });

  test("GIVEN no rows WHEN it renders THEN the empty message appears", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(row: Row) => row.id} />);

    expect(screen.getByText("Nenhum registro encontrado.")).toBeInTheDocument();
  });

  test("GIVEN a row action WHEN its button is clicked THEN the callback fires with that row", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        actions={[{ label: "Aprovar", onClick: onApprove }]}
      />,
    );

    const approveButtons = screen.getAllByRole("button", { name: "Aprovar" });
    await user.click(approveButtons[0]);
    expect(onApprove).toHaveBeenCalledWith(rows[0]);
  });
});
