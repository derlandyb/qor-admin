import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  test("GIVEN value=60 WHEN the plain variant renders THEN the fill width reflects 60%", () => {
    render(<ProgressBar value={60} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.firstElementChild).toHaveStyle({ width: "60%" });
  });

  test("GIVEN a value above 100 WHEN it renders THEN it clamps to 100%", () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  test("GIVEN a negative value WHEN it renders THEN it clamps to 0%", () => {
    render(<ProgressBar value={-10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  test("GIVEN the inner-label variant WHEN value is high enough THEN the percentage text is shown inside the fill", () => {
    render(<ProgressBar value={80} variant="inner-label" />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  test("GIVEN the outer-label variant WHEN it renders THEN the label and percentage appear above the bar", () => {
    render(<ProgressBar value={40} variant="outer-label" label="Publicações usadas" />);
    expect(screen.getByText("Publicações usadas")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  test("GIVEN the circular variant WHEN it renders THEN it exposes the same progressbar semantics", () => {
    render(<ProgressBar value={25} variant="circular" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByText("25%")).toBeInTheDocument();
  });
});
