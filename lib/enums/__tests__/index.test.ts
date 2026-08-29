import {
  ApprovalDecidableType,
  ApprovalOutcome,
  ApprovalStatus,
  BillingCycle,
  City,
  CityLabel,
  ConsentType,
  EventCreatedByType,
  EventStatus,
  SubscribableType,
  SubscriptionStatus,
} from "../index";

describe("enum mirrors", () => {
  test("GIVEN ApprovalStatus WHEN read THEN values match the API's backed enum strings", () => {
    expect(ApprovalStatus).toEqual({
      PendingApproval: "pending_approval",
      Approved: "approved",
      Rejected: "rejected",
      Suspended: "suspended",
    });
  });

  test("GIVEN ApprovalOutcome WHEN read THEN values match the API's backed enum strings", () => {
    expect(ApprovalOutcome).toEqual({
      Approved: "approved",
      Rejected: "rejected",
      Suspended: "suspended",
      SuspensionLifted: "suspension_lifted",
      ForceCancelled: "force_cancelled",
    });
  });

  test("GIVEN ApprovalDecidableType WHEN read THEN values match the API's backed enum strings", () => {
    expect(ApprovalDecidableType).toEqual({
      Venue: "venue",
      Promoter: "promoter",
      Event: "event",
    });
  });

  test("GIVEN EventStatus WHEN read THEN values match the API's backed enum strings", () => {
    expect(EventStatus).toEqual({
      Draft: "draft",
      PendingReview: "pending_review",
      Published: "published",
      Cancelled: "cancelled",
      Ended: "ended",
    });
  });

  test("GIVEN EventCreatedByType WHEN read THEN values match the API's backed enum strings", () => {
    expect(EventCreatedByType).toEqual({ VenueAdmin: "venue_admin", Promoter: "promoter" });
  });

  test("GIVEN City WHEN read THEN values match the API's backed enum strings", () => {
    expect(City).toEqual({
      Vitoria: "vitoria",
      VilaVelha: "vila_velha",
      Serra: "serra",
      Cariacica: "cariacica",
    });
  });

  test("GIVEN CityLabel WHEN read THEN every City case has a pt-BR label", () => {
    Object.values(City).forEach((city) => {
      expect(CityLabel[city]).toBeTruthy();
    });
  });

  test("GIVEN ConsentType WHEN read THEN values match the API's backed enum strings", () => {
    expect(ConsentType).toEqual({ Terms: "terms", Location: "location" });
  });

  test("GIVEN SubscribableType WHEN read THEN values match the API's backed enum strings", () => {
    expect(SubscribableType).toEqual({ Venue: "venue", Promoter: "promoter" });
  });

  test("GIVEN SubscriptionStatus WHEN read THEN values match the API's backed enum strings", () => {
    expect(SubscriptionStatus).toEqual({
      Active: "active",
      CancelledPendingReset: "cancelled_pending_reset",
    });
  });

  test("GIVEN BillingCycle WHEN read THEN values match the API's backed enum strings", () => {
    expect(BillingCycle).toEqual({ Monthly: "monthly", Annual: "annual" });
  });
});
