import { describe, expect, test } from "vitest";
import {
  validateVenueRegistration,
  validatePromoterRegistration,
  validateEventFields,
  type VenueRegistrationDraft,
  type PromoterRegistrationDraft,
} from "./form-validation";

const validVenue: VenueRegistrationDraft = {
  name: "Casa de Shows",
  description: "Live music venue",
  address: "Rua X, 100",
  city: "vitoria",
  contact_phone: "27999999999",
  contact_email: "contato@casa.com",
  registration_email: "admin@casa.com",
  password: "secret123",
  terms_accepted: true,
};

const validPromoter: PromoterRegistrationDraft = {
  name: "DJ Promo",
  contact_phone: "27988888888",
  contact_email: "dj@promo.com",
  registration_email: "dj@promo.com",
  password: "secret123",
  terms_accepted: true,
};

describe("validateVenueRegistration", () => {
  test("GIVEN a fully valid draft WHEN validated THEN there are no errors", () => {
    expect(validateVenueRegistration(validVenue)).toEqual({});
  });

  test("GIVEN missing required fields WHEN validated THEN each is flagged", () => {
    const errors = validateVenueRegistration({ ...validVenue, name: "", contact_email: "" });
    expect(errors.name).toBeDefined();
    expect(errors.contact_email).toBeDefined();
  });

  test("GIVEN an invalid email WHEN validated THEN it is flagged as invalid, not just missing", () => {
    const errors = validateVenueRegistration({ ...validVenue, contact_email: "not-an-email" });
    expect(errors.contact_email).toBe("E-mail inválido.");
  });

  test("GIVEN terms not accepted WHEN validated THEN it is flagged", () => {
    const errors = validateVenueRegistration({ ...validVenue, terms_accepted: false });
    expect(errors.terms_accepted).toBeDefined();
  });
});

describe("validatePromoterRegistration", () => {
  test("GIVEN a fully valid draft WHEN validated THEN there are no errors", () => {
    expect(validatePromoterRegistration(validPromoter)).toEqual({});
  });

  test("GIVEN a missing name WHEN validated THEN it is flagged", () => {
    expect(validatePromoterRegistration({ ...validPromoter, name: "" }).name).toBeDefined();
  });
});

describe("validateEventFields", () => {
  const validFree = {
    title: "Show",
    description: "desc",
    starts_at: "2026-10-01T20:00",
    city: "vitoria" as const,
    genre_id: 1,
    is_free: true,
  };

  test("GIVEN a valid free event WHEN validated THEN there are no errors", () => {
    expect(validateEventFields(validFree)).toEqual({});
  });

  test("GIVEN a paid event with no ticket_url WHEN validated THEN ticket_url is required", () => {
    const errors = validateEventFields({ ...validFree, is_free: false });
    expect(errors.ticket_url).toBe("O link do ingresso é obrigatório para eventos pagos.");
  });

  test("GIVEN a paid event with a ticket_url WHEN validated THEN ticket_url is not flagged", () => {
    const errors = validateEventFields({
      ...validFree,
      is_free: false,
      ticket_url: "https://ingressos.com/show",
    });
    expect(errors.ticket_url).toBeUndefined();
  });

  test("GIVEN missing title/description/starts_at/city/genre_id WHEN validated THEN each is flagged", () => {
    const errors = validateEventFields({ is_free: true });
    expect(errors.title).toBeDefined();
    expect(errors.description).toBeDefined();
    expect(errors.starts_at).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.genre_id).toBeDefined();
  });
});
