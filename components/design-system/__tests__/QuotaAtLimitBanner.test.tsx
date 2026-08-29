import { render, screen } from "@testing-library/react";
import { QuotaAtLimitBanner, UPGRADE_PLAN_URL } from "../QuotaAtLimitBanner";
import type { UsageSummary } from "@/lib/api/types";

const usage: UsageSummary = {
  plan_name: "Gratuito",
  monthly_price: 0,
  publish_quota: 5,
  publishes_used_this_period: 5,
  is_at_limit: true,
};

describe("QuotaAtLimitBanner", () => {
  test("GIVEN at-limit usage WHEN rendered THEN it shows the pt-BR message, an upgrade link, and the usage widget", () => {
    render(<QuotaAtLimitBanner usage={usage} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/atingiu o limite/i);
    expect(screen.getByRole("link", { name: "Ver planos disponíveis" })).toHaveAttribute(
      "href",
      UPGRADE_PLAN_URL,
    );
    expect(screen.getByText("5 de 5 publicações usadas este mês")).toBeInTheDocument();
  });
});
