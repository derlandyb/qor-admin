import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentCapture } from "./ConsentCapture";

describe("ConsentCapture", () => {
  test("GIVEN checked=false WHEN it renders THEN the checkbox is not pre-checked", () => {
    render(<ConsentCapture policyVersion="1.0" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  test("GIVEN the checkbox WHEN it renders THEN it is marked required", () => {
    render(<ConsentCapture policyVersion="1.0" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox")).toBeRequired();
  });

  test("GIVEN a click on the checkbox WHEN toggled THEN onChange fires with the new value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConsentCapture policyVersion="1.0" checked={false} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test("GIVEN a policy version WHEN it renders THEN the version is shown in the pt-BR consent text", () => {
    render(<ConsentCapture policyVersion="2.1" checked={false} onChange={vi.fn()} />);
    expect(screen.getByText(/versão 2\.1/)).toBeInTheDocument();
  });
});
