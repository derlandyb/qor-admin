import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DecisionModal } from "../DecisionModal";

describe("DecisionModal", () => {
  it("GIVEN open=false WHEN rendered THEN nothing is rendered", () => {
    const { container } = render(
      <DecisionModal
        open={false}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("GIVEN open=true WHEN rendered THEN the backdrop carries the §5.9 fade tokens", () => {
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement as HTMLElement;

    expect(backdrop.className).toContain("bg-black/50");
    expect(backdrop.className).toContain("duration-admin-modal-fade");
    expect(backdrop.className).toContain("ease-admin-modal-fade");
  });

  it("GIVEN open=true WHEN rendered THEN the dialog carries the §5.9 transform-slide tokens", () => {
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");

    expect(dialog.className).toContain("duration-admin-modal");
    expect(dialog.className).toContain("ease-admin-modal");
    expect(dialog.className).not.toContain("duration-admin-modal-fade");
  });

  it("GIVEN open=true WHEN rendered THEN the dialog uses rounded-admin-modal and bg-admin-bg-surface-alt", () => {
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");

    expect(dialog.className).toContain("rounded-admin-modal");
    expect(dialog.className).toContain("bg-admin-bg-surface-alt");
  });

  it("GIVEN the title prop WHEN rendered THEN it is shown", () => {
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText("Aprovar cadastro")).toBeInTheDocument();
  });

  it("GIVEN the reason field left blank WHEN confirmed THEN onConfirm is called with undefined", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it("GIVEN text typed into the reason field WHEN confirmed THEN onConfirm is called with that value", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(
      <DecisionModal
        open={true}
        title="Rejeitar cadastro"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Motivo (opcional)"), "Documentação incompleta");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onConfirm).toHaveBeenCalledWith("Documentação incompleta");
  });

  it("GIVEN showReasonField=false WHEN rendered THEN no reason field is shown", () => {
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        showReasonField={false}
      />,
    );
    expect(screen.queryByLabelText("Motivo (opcional)")).not.toBeInTheDocument();
  });

  it("GIVEN the cancel button WHEN clicked THEN onCancel fires", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("GIVEN custom confirm/cancel labels WHEN rendered THEN they are used as button text", () => {
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        confirmLabel="Aprovar"
        cancelLabel="Voltar"
      />,
    );
    expect(screen.getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  });

  it("GIVEN isSubmitting=true WHEN rendered THEN the confirm/cancel buttons are disabled", () => {
    render(
      <DecisionModal
        open={true}
        title="Aprovar cadastro"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isSubmitting={true}
      />,
    );
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
