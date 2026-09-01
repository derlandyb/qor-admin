import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

test("GIVEN the scaffold home page WHEN it renders THEN the getting-started heading is present", () => {
  render(<Page />);
  expect(
    screen.getByText(/To get started, edit the/i),
  ).toBeInTheDocument();
});
