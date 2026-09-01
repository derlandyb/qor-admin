import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

test("GIVEN the placeholder home page WHEN it renders THEN it shows the pt-BR pages-pending message", () => {
  render(<Page />);
  expect(screen.getByText(/páginas chegam em uma sessão futura/i)).toBeInTheDocument();
});
