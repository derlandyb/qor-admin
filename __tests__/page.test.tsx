import { expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { redirect } from "next/navigation";
import Page from "../app/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

test("GIVEN the home route WHEN it renders THEN it redirects to /dashboard (real pages now exist, per AT22)", () => {
  render(<Page />);
  expect(redirect).toHaveBeenCalledWith("/dashboard");
});
