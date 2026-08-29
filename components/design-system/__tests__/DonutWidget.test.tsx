import { render, screen } from "@testing-library/react";

import { DonutWidget } from "../DonutWidget";

describe("DonutWidget", () => {
  test("GIVEN segments WHEN DonutWidget renders THEN it shows the total and each segment's label and value", () => {
    render(
      <DonutWidget
        total={42}
        segments={[
          { label: "Publicado", value: 20, color: "success" },
          { label: "Rascunho", value: 12, color: "warning" },
          { label: "Cancelado", value: 10, color: "danger" },
        ]}
      />,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  test("GIVEN no segments WHEN DonutWidget renders THEN it still shows the total without error", () => {
    render(<DonutWidget total={0} segments={[]} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
