import type { City } from "../enums/city";
import type {
  ApprovalDecidableType,
  ApprovalOutcome,
  ApprovalStatus,
} from "../enums/approval";
import type { EventCreatedByType, EventStatus } from "../enums/event-status";

export interface AdminAccount {
  id: number;
  name: string;
  email: string;
  permissions: string[];
}

/** `AdminRole` (`components/layout/nav-items.ts`) mirrors this value set 1:1. */
export type AccountType = "super_admin" | "venue_admin" | "promoter";

/** `GET /api/admin/v1/me` — session identity, re-fetched on every page load since the SPA never persists it client-side (ARCHITECTURE §2). */
export interface AdminSessionAccount extends AdminAccount {
  account_type: AccountType;
}

export interface Venue {
  id: number;
  name: string;
  description: string;
  address: string;
  city: City;
  contact_phone: string;
  contact_email: string;
  approval_status: ApprovalStatus;
  image_url: string | null;
}

export interface Promoter {
  id: number;
  name: string;
  contact_phone: string;
  contact_email: string;
  instagram: string | null;
  tiktok: string | null;
  approval_status: ApprovalStatus;
}

export type PendingAccount =
  | ({ type: "venue" } & Omit<Venue, "approval_status" | "description" | "address" | "image_url">)
  | ({ type: "promoter" } & Pick<
      Promoter,
      "id" | "name" | "contact_email" | "contact_phone" | "instagram" | "tiktok"
    >);

export interface EventPromoter {
  id: number;
  name: string;
  contact_phone: string;
  contact_email: string;
  instagram: string | null;
  tiktok: string | null;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  cover_image_url: string | null;
  starts_at: string;
  city: City;
  genre_id: number;
  address: string | null;
  is_free: boolean;
  ticket_url: string | null;
  capacity: number | null;
  age_rating: string | null;
  notes: string | null;
  status: EventStatus;
  rejection_feedback: string | null;
  created_by_type: EventCreatedByType;
  created_by_id: number;
  promoters: EventPromoter[];
}

export interface DashboardEvent {
  id: number;
  title: string;
  starts_at: string;
  status: EventStatus;
  view_count: number | null;
  favorite_count: number | null;
  ticket_click_count: number | null;
  interested_count: number | null;
}

export interface ApprovalDecision {
  id: number;
  decidable_type: ApprovalDecidableType;
  decidable_id: number;
  outcome: ApprovalOutcome;
  reason: string | null;
  decided_by: number;
  decided_at: string;
}

export interface UsageSummary {
  plan_name: string;
  monthly_price: number;
  publish_quota: number | null;
  publishes_used_this_period: number;
  is_at_limit: boolean;
}

export interface Plan {
  id: number;
  name: string;
  monthly_price: number;
  annual_price: number | null;
  publish_quota: number | null;
  is_active: boolean;
  is_default_free: boolean;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
}

export interface DataEnvelope<T> {
  data: T;
}
