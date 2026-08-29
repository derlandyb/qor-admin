import { render, screen } from "@testing-library/react";
import { Button, type AdminColor, type ButtonVariant } from "../Button";

const COLORS: AdminColor[] = [
  "primary",
  "secondary",
  "success",
  "danger",
  "warning",
  "info",
  "light",
  "dark",
];

const VARIANTS: ButtonVariant[] = ["solid", "outline", "pill"];

describe("Button", () => {
  it("GIVEN no props WHEN rendered THEN defaults to primary/pill with the transition classes", () => {
    render(<Button>Salvar</Button>);
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button.className).toContain("bg-admin-primary");
    expect(button.className).toContain("rounded-admin-button-pill");
    expect(button.className).toContain(
      "transition-[color,background-color,border-color,box-shadow]",
    );
    expect(button.className).toContain("duration-admin-control");
    expect(button.className).toContain("ease-admin-control");
  });

  it.each(COLORS)(
    "GIVEN color=%s WHEN variant=solid THEN renders the solid background class",
    (color) => {
      render(<Button color={color} variant="solid">X</Button>);
      const button = screen.getByRole("button", { name: "X" });
      expect(button.className).toContain(`bg-admin-${color}`);
      expect(button.className).toContain("rounded-admin-button");
      expect(button.className).not.toContain("rounded-admin-button-pill");
    },
  );

  it.each(COLORS)(
    "GIVEN color=%s WHEN variant=outline THEN renders transparent bg with colored border/text",
    (color) => {
      render(<Button color={color} variant="outline">X</Button>);
      const button = screen.getByRole("button", { name: "X" });
      expect(button.className).toContain("bg-transparent");
      expect(button.className).toContain(`border-admin-${color}`);
      expect(button.className).toContain(`text-admin-${color}`);
    },
  );

  it.each(COLORS)(
    "GIVEN color=%s WHEN variant=pill THEN renders the pill radius with the solid background",
    (color) => {
      render(<Button color={color} variant="pill">X</Button>);
      const button = screen.getByRole("button", { name: "X" });
      expect(button.className).toContain(`bg-admin-${color}`);
      expect(button.className).toContain("rounded-admin-button-pill");
    },
  );

  it.each(VARIANTS)(
    "GIVEN variant=%s WHEN rendered THEN always carries the 150ms ease-in-out transition classes",
    (variant) => {
      render(
        <Button color="danger" variant={variant}>
          X
        </Button>,
      );
      const button = screen.getByRole("button", { name: "X" });
      expect(button.className).toContain(
        "transition-[color,background-color,border-color,box-shadow]",
      );
      expect(button.className).toContain("duration-admin-control");
      expect(button.className).toContain("ease-admin-control");
    },
  );

  it("GIVEN light or secondary color WHEN variant=solid THEN uses dark text for contrast", () => {
    render(
      <>
        <Button color="light" variant="solid">
          Light
        </Button>
        <Button color="secondary" variant="solid">
          Secondary
        </Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Light" }).className).toContain(
      "text-admin-dark",
    );
    expect(
      screen.getByRole("button", { name: "Secondary" }).className,
    ).toContain("text-admin-dark");
  });

  it("GIVEN onClick and other native button props WHEN rendered THEN they are spread onto the button", () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} type="submit" disabled>
        Enviar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
  });
});
