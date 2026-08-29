import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentCapture } from "../ConsentCapture";

describe("ConsentCapture", () => {
  it("GIVEN checked=false WHEN rendered THEN the checkbox is unchecked by default", () => {
    render(<ConsentCapture checked={false} onChange={jest.fn()} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("GIVEN an unchecked checkbox WHEN the user clicks it THEN onChange fires with true", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ConsentCapture checked={false} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("GIVEN a checked checkbox WHEN the user clicks it THEN onChange fires with false", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ConsentCapture checked={true} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("GIVEN a policyVersion WHEN rendered THEN it is shown next to the terms label", () => {
    render(<ConsentCapture checked={false} onChange={jest.fn()} policyVersion="v1.0" />);
    expect(screen.getByText("(v1.0)")).toBeInTheDocument();
  });

  it("GIVEN no policyVersion WHEN rendered THEN no version text is shown", () => {
    render(<ConsentCapture checked={false} onChange={jest.fn()} />);
    expect(screen.queryByText(/^\(v/)).not.toBeInTheDocument();
  });

  it("GIVEN an error WHEN rendered THEN it is shown as an alert", () => {
    render(
      <ConsentCapture
        checked={false}
        onChange={jest.fn()}
        error="É necessário aceitar os termos de uso."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "É necessário aceitar os termos de uso.",
    );
  });

  it("GIVEN no error WHEN rendered THEN no alert is shown", () => {
    render(<ConsentCapture checked={false} onChange={jest.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("GIVEN rendered THEN the checkbox has no transition utility class", () => {
    render(<ConsentCapture checked={false} onChange={jest.fn()} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.className).not.toContain("transition");
  });
});
