import type {
  ApprovalDecidableType,
  ApprovalOutcome,
  ApprovalStatus,
  City,
  EventCreatedByType,
  EventStatus,
} from "@/lib/enums";

export interface AdminAccount {
  id: number;
  name: string;
  email: string;
  permissions: string[];
}

export interface LoginResponse {
  data: AdminAccount;
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

export interface PendingAccount {
  id: number;
  type: ApprovalDecidableType;
  name: string;
  contact_email: string;
  contact_phone: string;
  city?: City;
  instagram?: string | null;
  tiktok?: string | null;
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

export interface QorEvent {
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
  created_by_type: EventCreatedByType;
  created_by_id: number;
  tagged_promoter_ids?: number[];
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

export interface Plan {
  id: number;
  name: string;
  monthly_price: number;
  annual_price: number | null;
  publish_quota: number | null;
  is_active: boolean;
  is_default_free: boolean;
}

export interface UsageSummary {
  plan_name: string;
  monthly_price: number;
  publish_quota: number | null;
  publishes_used_this_period: number;
  is_at_limit: boolean;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
}

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

export interface RegisterVenuePayload {
  name: string;
  description: string;
  address: string;
  city: City;
  contact_phone: string;
  contact_email: string;
  registration_email: string;
  password: string;
  terms_accepted: boolean;
}

export interface RegisterPromoterPayload {
  name: string;
  contact_phone: string;
  contact_email: string;
  instagram?: string | null;
  tiktok?: string | null;
  registration_email: string;
  password: string;
  terms_accepted: boolean;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  starts_at: string;
  city: City;
  genre_id: number;
  is_free: boolean;
  address?: string | null;
  ticket_url?: string | null;
  capacity?: number | null;
  age_rating?: string | null;
  notes?: string | null;
  cover_image?: File | null;
  promoter_ids?: number[];
}

export type EditEventPayload = Partial<CreateEventPayload>;

export interface DecideAccountApprovalPayload {
  outcome: ApprovalOutcome;
  reason?: string | null;
}

export interface DecideEventApprovalPayload {
  outcome: ApprovalOutcome;
  feedback?: string | null;
}

export interface PlanPayload {
  name: string;
  monthly_price: number;
  annual_price?: number | null;
  publish_quota: number;
}
