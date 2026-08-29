import { render, screen } from "@testing-library/react";
import { QuotaUsageWidget } from "../QuotaUsageWidget";
import type { UsageSummary } from "@/lib/api/types";

function makeUsage(overrides: Partial<UsageSummary> = {}): UsageSummary {
  return {
    plan_name: "Plano Pro",
    monthly_price: 99,
    publish_quota: 5,
    publishes_used_this_period: 3,
    is_at_limit: false,
    ...overrides,
  };
}

describe("QuotaUsageWidget", () => {
  it("GIVEN a normal usage object WHEN rendered THEN it shows the X de Y text and the bar has matching value/max", () => {
    const { getByRole } = render(<QuotaUsageWidget usage={makeUsage()} />);

    expect(
      screen.getByText("3 de 5 publicações usadas este mês"),
    ).toBeInTheDocument();

    const bar = getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
  });

  it("GIVEN a normal usage object WHEN rendered THEN the bar uses the primary color and no at-limit note is shown", () => {
    const { getByRole } = render(<QuotaUsageWidget usage={makeUsage()} />);
    const bar = getByRole("progressbar");
    const fill = bar.firstElementChild as HTMLElement;

    expect(fill.className).toContain("bg-admin-primary");
    expect(
      screen.queryByText("Limite de publicações atingido."),
    ).not.toBeInTheDocument();
  });

  it("GIVEN is_at_limit true WHEN rendered THEN the bar is danger-colored and the at-limit note is shown", () => {
    const { getByRole } = render(
      <QuotaUsageWidget
        usage={makeUsage({
          publishes_used_this_period: 5,
          is_at_limit: true,
        })}
      />,
    );
    const bar = getByRole("progressbar");
    const fill = bar.firstElementChild as HTMLElement;

    expect(fill.className).toContain("bg-admin-danger");
    expect(
      screen.getByText("Limite de publicações atingido."),
    ).toBeInTheDocument();
  });

  it("GIVEN publish_quota is null WHEN rendered THEN it shows the unlimited-plan text and no progress bar", () => {
    render(
      <QuotaUsageWidget
        usage={makeUsage({
          publish_quota: null,
          publishes_used_this_period: 12,
        })}
      />,
    );

    expect(
      screen.getByText("12 publicações usadas este mês (sem limite)"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
