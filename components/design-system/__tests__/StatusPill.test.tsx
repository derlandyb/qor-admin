import { render, screen } from "@testing-library/react";

import { ApprovalStatus, EventStatus } from "@/lib/enums";
import { StatusPill } from "../StatusPill";

describe("StatusPill", () => {
  const cases: Array<{
    status: ApprovalStatus | EventStatus;
    label: string;
    colorClass: string;
  }> = [
    { status: ApprovalStatus.PendingApproval, label: "Pendente", colorClass: "bg-admin-warning" },
    { status: ApprovalStatus.Approved, label: "Aprovado", colorClass: "bg-admin-success" },
    { status: ApprovalStatus.Rejected, label: "Rejeitado", colorClass: "bg-admin-danger" },
    { status: ApprovalStatus.Suspended, label: "Suspenso", colorClass: "bg-admin-danger" },
    { status: EventStatus.Draft, label: "Rascunho", colorClass: "bg-admin-warning" },
    { status: EventStatus.PendingReview, label: "Em análise", colorClass: "bg-admin-warning" },
    { status: EventStatus.Published, label: "Publicado", colorClass: "bg-admin-success" },
    { status: EventStatus.Cancelled, label: "Cancelado", colorClass: "bg-admin-danger" },
    { status: EventStatus.Ended, label: "Encerrado", colorClass: "bg-admin-info" },
  ];

  test.each(cases)(
    "GIVEN status $status WHEN StatusPill renders THEN it shows label $label with color $colorClass",
    ({ status, label, colorClass }) => {
      render(<StatusPill status={status} />);

      const pill = screen.getByText(label);
      expect(pill).toBeInTheDocument();
      expect(pill).toHaveClass(colorClass);
    },
  );

  test("GIVEN a label override WHEN StatusPill renders THEN it shows the override instead of the default label", () => {
    render(<StatusPill status={ApprovalStatus.Approved} label="Custom" />);

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByText("Aprovado")).not.toBeInTheDocument();
  });
});
