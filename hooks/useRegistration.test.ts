import { describe, expect, test, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useVenueRegistration, usePromoterRegistration } from "./useRegistration";
import * as client from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Venue, Promoter } from "../lib/api/types";

vi.mock("../lib/api/client");

const mockedClient = vi.mocked(client);

function makeVenue(overrides?: Partial<Venue>): Venue {
  return {
    id: 1,
    name: "Casa X",
    description: "desc",
    address: "Rua A",
    city: "vitoria" as never,
    contact_phone: "1",
    contact_email: "a@a.com",
    approval_status: "pending" as never,
    image_url: null,
    ...overrides,
  };
}

function makePromoter(overrides?: Partial<Promoter>): Promoter {
  return {
    id: 1,
    name: "Promoter X",
    contact_phone: "1",
    contact_email: "a@a.com",
    instagram: null,
    tiktok: null,
    approval_status: "pending" as never,
    ...overrides,
  };
}

const venuePayload = {
  name: "Casa X",
  description: "desc",
  address: "Rua A",
  city: "vitoria" as never,
  contact_phone: "1",
  contact_email: "a@a.com",
  registration_email: "a@a.com",
  password: "secret123",
  terms_accepted: true as const,
};

const promoterPayload = {
  name: "Promoter X",
  contact_phone: "1",
  contact_email: "a@a.com",
  registration_email: "a@a.com",
  password: "secret123",
  terms_accepted: true as const,
};

describe("useVenueRegistration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN registerVenue resolves WHEN register is called THEN it returns the created venue and stops loading", async () => {
    mockedClient.registerVenue.mockResolvedValue({ data: makeVenue() });

    const { result } = renderHook(() => useVenueRegistration());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    let created: Venue | undefined;
    await act(async () => {
      created = await result.current.register(venuePayload);
    });

    expect(created).toEqual(makeVenue());
    expect(mockedClient.registerVenue).toHaveBeenCalledWith(venuePayload);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN registerVenue rejects with an ApiError WHEN register is called THEN it sets the error message and re-throws", async () => {
    mockedClient.registerVenue.mockRejectedValue(new ApiError(422, "Dados inválidos."));

    const { result } = renderHook(() => useVenueRegistration());

    await act(async () => {
      await expect(result.current.register(venuePayload)).rejects.toThrow(ApiError);
    });

    await waitFor(() => expect(result.current.error).toBe("Dados inválidos."));
    expect(result.current.loading).toBe(false);
  });

  test("GIVEN a previous error WHEN register is called again THEN the error is cleared at the start of the call", async () => {
    mockedClient.registerVenue.mockRejectedValueOnce(new ApiError(422, "Dados inválidos."));
    mockedClient.registerVenue.mockResolvedValueOnce({ data: makeVenue() });

    const { result } = renderHook(() => useVenueRegistration());

    await act(async () => {
      await expect(result.current.register(venuePayload)).rejects.toThrow(ApiError);
    });
    await waitFor(() => expect(result.current.error).toBe("Dados inválidos."));

    await act(async () => {
      await result.current.register(venuePayload);
    });

    expect(result.current.error).toBeNull();
  });

  test("GIVEN register is in flight WHEN called THEN loading is true until it settles", async () => {
    let resolvePromise: (value: { data: Venue }) => void = () => {};
    mockedClient.registerVenue.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useVenueRegistration());

    let registerPromise: Promise<Venue>;
    act(() => {
      registerPromise = result.current.register(venuePayload);
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolvePromise({ data: makeVenue() });
      await registerPromise;
    });

    expect(result.current.loading).toBe(false);
  });
});

describe("usePromoterRegistration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN registerPromoter resolves WHEN register is called THEN it returns the created promoter and stops loading", async () => {
    mockedClient.registerPromoter.mockResolvedValue({ data: makePromoter() });

    const { result } = renderHook(() => usePromoterRegistration());

    let created: Promoter | undefined;
    await act(async () => {
      created = await result.current.register(promoterPayload);
    });

    expect(created).toEqual(makePromoter());
    expect(mockedClient.registerPromoter).toHaveBeenCalledWith(promoterPayload);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN registerPromoter rejects with an ApiError WHEN register is called THEN it sets the error message and re-throws", async () => {
    mockedClient.registerPromoter.mockRejectedValue(new ApiError(422, "Dados inválidos."));

    const { result } = renderHook(() => usePromoterRegistration());

    await act(async () => {
      await expect(result.current.register(promoterPayload)).rejects.toThrow(ApiError);
    });

    await waitFor(() => expect(result.current.error).toBe("Dados inválidos."));
    expect(result.current.loading).toBe(false);
  });
});
