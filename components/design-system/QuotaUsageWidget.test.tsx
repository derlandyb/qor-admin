import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuotaUsageWidget } from "./QuotaUsageWidget";
import type { UsageSummary } from "../../lib/api/types";

function makeUsage(overrides?: Partial<UsageSummary>): UsageSummary {
  return {
    plan_name: "Gratuito",
    monthly_price: 0,
    publish_quota: 5,
    publishes_used_this_period: 2,
    is_at_limit: false,
    ...overrides,
  };
}

describe("QuotaUsageWidget", () => {
  test("GIVEN a plan under quota WHEN it renders THEN it shows the usage progress bar with the primary color and no at-limit banner", () => {
    render(<QuotaUsageWidget usage={makeUsage()} />);

    expect(screen.getByText("2 de 5 publicações usadas este mês")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("GIVEN a plan at its quota limit WHEN it renders THEN it shows the at-limit pt-BR banner", () => {
    render(
      <QuotaUsageWidget usage={makeUsage({ publishes_used_this_period: 5, is_at_limit: true })} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Você atingiu o limite de publicações do seu plano",
    );
  });

  test("GIVEN an at-limit plan WHEN an upgradeHref is provided THEN it renders the upgrade link", () => {
    render(
      <QuotaUsageWidget
        usage={makeUsage({ is_at_limit: true })}
        upgradeHref="https://qor.example/planos"
      />,
    );

    expect(screen.getByRole("link", { name: "Fazer upgrade" })).toHaveAttribute(
      "href",
      "https://qor.example/planos",
    );
  });

  test("GIVEN a plan with an unlimited (null) quota WHEN it renders THEN it shows the unlimited message instead of a progress bar", () => {
    render(<QuotaUsageWidget usage={makeUsage({ publish_quota: null })} />);

    expect(screen.getByText("Publicações ilimitadas.")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
