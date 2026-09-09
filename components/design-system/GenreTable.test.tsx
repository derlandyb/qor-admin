import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenreTable } from "./GenreTable";
import type { Genre } from "../../lib/api/types";

function makeGenre(overrides?: Partial<Genre>): Genre {
  return {
    id: 1,
    name: "Rock",
    slug: "rock",
    is_active: true,
    ...overrides,
  };
}

describe("GenreTable", () => {
  test("GIVEN genres WHEN it renders THEN it shows name/slug/status columns", () => {
    render(
      <GenreTable genres={[makeGenre()]} onEdit={vi.fn()} onActivate={vi.fn()} onDeactivate={vi.fn()} />,
    );

    expect(screen.getByText("Rock")).toBeInTheDocument();
    expect(screen.getByText("rock")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  test("GIVEN an active genre WHEN Desativar is clicked THEN onDeactivate fires with that genre", async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    render(
      <GenreTable
        genres={[makeGenre()]}
        onEdit={vi.fn()}
        onActivate={vi.fn()}
        onDeactivate={onDeactivate}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    expect(onDeactivate).toHaveBeenCalledWith(makeGenre());
  });

  test("GIVEN an inactive genre WHEN Ativar is clicked THEN onActivate fires with that genre", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(
      <GenreTable
        genres={[makeGenre({ is_active: false })]}
        onEdit={vi.fn()}
        onActivate={onActivate}
        onDeactivate={vi.fn()}
      />,
    );

    expect(screen.getByText("Inativo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ativar" }));

    expect(onActivate).toHaveBeenCalledWith(makeGenre({ is_active: false }));
  });

  test("GIVEN a genre WHEN Editar is clicked THEN onEdit fires with that genre", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <GenreTable genres={[makeGenre()]} onEdit={onEdit} onActivate={vi.fn()} onDeactivate={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(onEdit).toHaveBeenCalledWith(makeGenre());
  });
});
