import { describe, expect, test } from "vitest";
import { CITY_VALUES, CITY_LABELS } from "./city";
import {
  APPROVAL_DECIDABLE_TYPE_VALUES,
  APPROVAL_STATUS_VALUES,
  APPROVAL_OUTCOME_VALUES,
} from "./approval";
import { EVENT_STATUS_VALUES, EVENT_CREATED_BY_TYPE_VALUES } from "./event-status";

describe("enum mirrors", () => {
  test("GIVEN City WHEN comparing values THEN it matches api's 4-city fixed enum", () => {
    expect(CITY_VALUES).toEqual(["vitoria", "vila_velha", "serra", "cariacica"]);
    expect(Object.keys(CITY_LABELS)).toEqual([...CITY_VALUES]);
  });

  test("GIVEN ApprovalDecidableType WHEN comparing values THEN it matches api's enum", () => {
    expect(APPROVAL_DECIDABLE_TYPE_VALUES).toEqual(["venue", "promoter", "event"]);
  });

  test("GIVEN ApprovalStatus WHEN comparing values THEN it matches api's enum", () => {
    expect(APPROVAL_STATUS_VALUES).toEqual([
      "pending_approval",
      "approved",
      "rejected",
      "suspended",
    ]);
  });

  test("GIVEN ApprovalOutcome WHEN comparing values THEN it matches api's enum", () => {
    expect(APPROVAL_OUTCOME_VALUES).toEqual([
      "approved",
      "rejected",
      "suspended",
      "suspension_lifted",
      "force_cancelled",
    ]);
  });

  test("GIVEN EventStatus WHEN comparing values THEN it matches api's enum", () => {
    expect(EVENT_STATUS_VALUES).toEqual([
      "draft",
      "pending_review",
      "published",
      "cancelled",
      "ended",
    ]);
  });

  test("GIVEN EventCreatedByType WHEN comparing values THEN it matches api's enum", () => {
    expect(EVENT_CREATED_BY_TYPE_VALUES).toEqual(["venue_admin", "promoter"]);
  });
});
