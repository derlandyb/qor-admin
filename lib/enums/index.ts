/**
 * TypeScript mirrors of qor-api's backed PHP enums (ARCHITECTURE.md §14.1/§14.3).
 * Values must match the PHP enum cases' backing strings exactly
 * (see api/src/Domain/**\/Enum/*.php) — never compare against a raw literal
 * at a call site, always import the const from here.
 */

export const ApprovalStatus = {
  PendingApproval: "pending_approval",
  Approved: "approved",
  Rejected: "rejected",
  Suspended: "suspended",
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const ApprovalOutcome = {
  Approved: "approved",
  Rejected: "rejected",
  Suspended: "suspended",
  SuspensionLifted: "suspension_lifted",
  ForceCancelled: "force_cancelled",
} as const;
export type ApprovalOutcome = (typeof ApprovalOutcome)[keyof typeof ApprovalOutcome];

export const ApprovalDecidableType = {
  Venue: "venue",
  Promoter: "promoter",
  Event: "event",
} as const;
export type ApprovalDecidableType =
  (typeof ApprovalDecidableType)[keyof typeof ApprovalDecidableType];

export const EventStatus = {
  Draft: "draft",
  PendingReview: "pending_review",
  Published: "published",
  Cancelled: "cancelled",
  Ended: "ended",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const EventCreatedByType = {
  VenueAdmin: "venue_admin",
  Promoter: "promoter",
} as const;
export type EventCreatedByType = (typeof EventCreatedByType)[keyof typeof EventCreatedByType];

export const City = {
  Vitoria: "vitoria",
  VilaVelha: "vila_velha",
  Serra: "serra",
  Cariacica: "cariacica",
} as const;
export type City = (typeof City)[keyof typeof City];

export const CityLabel: Record<City, string> = {
  [City.Vitoria]: "Vitória",
  [City.VilaVelha]: "Vila Velha",
  [City.Serra]: "Serra",
  [City.Cariacica]: "Cariacica",
};

export const ConsentType = {
  Terms: "terms",
  Location: "location",
} as const;
export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType];

export const SubscribableType = {
  Venue: "venue",
  Promoter: "promoter",
} as const;
export type SubscribableType = (typeof SubscribableType)[keyof typeof SubscribableType];

export const SubscriptionStatus = {
  Active: "active",
  CancelledPendingReset: "cancelled_pending_reset",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const BillingCycle = {
  Monthly: "monthly",
  Annual: "annual",
} as const;
export type BillingCycle = (typeof BillingCycle)[keyof typeof BillingCycle];
