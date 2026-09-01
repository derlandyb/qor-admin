import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DecisionModal } from "./DecisionModal";

describe("DecisionModal", () => {
  test("GIVEN open=false WHEN it renders THEN nothing is shown", () => {
    render(
      <DecisionModal
        open={false}
        title="Aprovar conta"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("GIVEN open=true WHEN it renders THEN the dialog, title, and reason field appear, and the reason field is not marked required", () => {
    render(
      <DecisionModal open title="Aprovar conta" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Aprovar conta")).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo (opcional)")).not.toBeRequired();
  });

  test("GIVEN no reason typed WHEN confirmed THEN onConfirm is called with null, not an empty string", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DecisionModal open title="Aprovar conta" onConfirm={onConfirm} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  test("GIVEN a reason typed WHEN confirmed THEN onConfirm is called with the trimmed reason", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DecisionModal open title="Rejeitar evento" onConfirm={onConfirm} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Motivo (opcional)"), "  Faltam detalhes  ");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledWith("Faltam detalhes");
  });

  test("GIVEN the cancel button WHEN clicked THEN onCancel fires and onConfirm does not", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DecisionModal open title="Aprovar conta" onConfirm={onConfirm} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("GIVEN the dialog content WHEN it renders THEN it carries no transition/duration class, matching §5.9's unmeasured-so-snap-instant treatment", () => {
    render(<DecisionModal open title="Aprovar conta" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).not.toMatch(/transition|duration/);
  });
});
