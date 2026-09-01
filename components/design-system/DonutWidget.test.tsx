import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { DonutWidget } from "./DonutWidget";

describe("DonutWidget", () => {
  test("GIVEN segments WHEN it renders THEN the total and each row label/value appear", () => {
    render(
      <DonutWidget
        title="Status dos eventos"
        total={12}
        segments={[
          { label: "Publicado", value: 8, color: "success" },
          { label: "Em Revisão", value: 3, color: "warning" },
          { label: "Cancelado", value: 1, color: "danger" },
        ]}
      />,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Em Revisão")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  test("GIVEN no segments WHEN it renders THEN it doesn't crash and shows a zero total", () => {
    render(<DonutWidget title="Status dos eventos" total={0} segments={[]} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
