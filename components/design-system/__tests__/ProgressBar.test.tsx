import { render } from "@testing-library/react";
import { ProgressBar } from "../ProgressBar";

describe("ProgressBar", () => {
  it("GIVEN value and default max WHEN rendered THEN fill width reflects value/100", () => {
    const { getByRole } = render(<ProgressBar value={30} />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("30%");
  });

  it("GIVEN a custom max WHEN rendered THEN fill width reflects value/max", () => {
    const { getByRole } = render(<ProgressBar value={3} max={5} />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("60%");
  });

  it("GIVEN a value above max WHEN rendered THEN width is clamped to 100%", () => {
    const { getByRole } = render(<ProgressBar value={150} />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("GIVEN a negative value WHEN rendered THEN width is clamped to 0%", () => {
    const { getByRole } = render(<ProgressBar value={-10} />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("GIVEN a color WHEN rendered THEN fill uses the matching background class", () => {
    const { getByRole } = render(<ProgressBar value={50} color="danger" />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.className).toContain("bg-admin-danger");
  });

  it("GIVEN striped without animated WHEN rendered THEN only the striped class is applied", () => {
    const { getByRole } = render(<ProgressBar value={50} striped />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.className).toContain("admin-progress-striped");
    expect(fill.className).not.toContain("admin-progress-animated");
  });

  it("GIVEN striped and animated WHEN rendered THEN both stripe and animation classes are applied", () => {
    const { getByRole } = render(<ProgressBar value={50} striped animated />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.className).toContain("admin-progress-striped");
    expect(fill.className).toContain("admin-progress-animated");
  });

  it("GIVEN animated without striped WHEN rendered THEN the animation class is not applied", () => {
    const { getByRole } = render(<ProgressBar value={50} animated />);
    const track = getByRole("progressbar");
    const fill = track.firstElementChild as HTMLElement;
    expect(fill.className).not.toContain("admin-progress-animated");
  });

  it("GIVEN a label WHEN rendered THEN it is exposed as the accessible name", () => {
    const { getByRole } = render(
      <ProgressBar value={3} max={5} label="3 de 5 publicações usadas" />,
    );
    const track = getByRole("progressbar", {
      name: "3 de 5 publicações usadas",
    });
    expect(track).toHaveAttribute("aria-valuenow", "3");
    expect(track).toHaveAttribute("aria-valuemax", "5");
  });
});
