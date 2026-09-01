import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Topbar } from "./Topbar";

describe("Topbar", () => {
  test("GIVEN the topbar WHEN it renders THEN the primary CTA and profile block appear", () => {
    render(<Topbar userName="Ana" />);

    expect(screen.getByRole("button", { name: /novo evento/i })).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  test("GIVEN onCreateEvent WHEN the CTA is clicked THEN it is called", async () => {
    const user = userEvent.setup();
    const onCreateEvent = vi.fn();
    render(<Topbar userName="Ana" onCreateEvent={onCreateEvent} />);

    await user.click(screen.getByRole("button", { name: /novo evento/i }));
    expect(onCreateEvent).toHaveBeenCalledTimes(1);
  });
});
