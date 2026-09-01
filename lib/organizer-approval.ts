/**
 * Shared helper for AT20's pending-approval-blocked gate (ADMIN-03): an
 * organizer (venue_admin or promoter) whose own account isn't yet
 * `approved` must not reach event creation/listing. `account_type` picks
 * which of useSession()'s `venue`/`promoter` records holds the relevant
 * `approval_status` — `super_admin` (or a session still missing its
 * profile record) is treated as "not blocked" here since this gate only
 * concerns organizer accounts; role-restricting these pages to organizers
 * in the first place is layout/nav wiring (AT22), not this helper's job.
 */
import type { AdminSessionAccount, Promoter, Venue } from "./api/types";

export function isOrganizerBlocked(
  account: AdminSessionAccount | null,
  venue: Venue | null,
  promoter: Promoter | null,
): boolean {
  if (account?.account_type === "venue_admin") {
    return venue?.approval_status !== "approved";
  }
  if (account?.account_type === "promoter") {
    return promoter?.approval_status !== "approved";
  }
  return false;
}
