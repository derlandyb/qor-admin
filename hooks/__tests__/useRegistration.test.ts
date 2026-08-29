import { act, renderHook, waitFor } from "@testing-library/react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { Promoter, RegisterPromoterPayload, RegisterVenuePayload, Venue } from "@/lib/api/types";

import { usePromoterRegistration, useVenueRegistration } from "../useRegistration";

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return {
    ApiError: actual.ApiError,
    apiClient: {
      venues: { register: jest.fn() },
      promoters: { register: jest.fn() },
    },
  };
});

const venuePayload: RegisterVenuePayload = {
  name: "Casa Show",
  description: "desc",
  address: "Rua X",
  city: "vitoria",
  contact_phone: "27999999999",
  contact_email: "venue@qor.app",
  registration_email: "login@qor.app",
  password: "senha-forte",
  terms_accepted: true,
};

const promoterPayload: RegisterPromoterPayload = {
  name: "Produtora X",
  contact_phone: "27999999999",
  contact_email: "promoter@qor.app",
  registration_email: "login@qor.app",
  password: "senha-forte",
  terms_accepted: true,
};

describe("useVenueRegistration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN valid payload WHEN register succeeds THEN it resolves with the created venue and clears submitting/error state", async () => {
    const venue: Venue = {
      id: 1,
      name: "Casa Show",
      description: "desc",
      address: "Rua X",
      city: "vitoria",
      contact_phone: "27999999999",
      contact_email: "venue@qor.app",
      approval_status: "pending_approval",
      image_url: null,
    };
    (apiClient.venues.register as jest.Mock).mockResolvedValue({ data: venue });

    const { result } = renderHook(() => useVenueRegistration());

    let returned: Venue | undefined;
    await act(async () => {
      returned = await result.current.register(venuePayload);
    });

    expect(returned).toEqual(venue);
    expect(apiClient.venues.register).toHaveBeenCalledWith(venuePayload);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN the API rejects WHEN register fails THEN it sets error and returns submitting to false", async () => {
    (apiClient.venues.register as jest.Mock).mockRejectedValue(
      new ApiError("E-mail já cadastrado.", 422),
    );

    const { result } = renderHook(() => useVenueRegistration());

    let returned: Venue | undefined;
    await act(async () => {
      returned = await result.current.register(venuePayload);
    });

    expect(returned).toBeUndefined();
    expect(result.current.error).toBe("E-mail já cadastrado.");
    expect(result.current.isSubmitting).toBe(false);
  });
});

describe("usePromoterRegistration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN valid payload WHEN register succeeds THEN it resolves with the created promoter", async () => {
    const promoter: Promoter = {
      id: 1,
      name: "Produtora X",
      contact_phone: "27999999999",
      contact_email: "promoter@qor.app",
      instagram: null,
      tiktok: null,
      approval_status: "pending_approval",
    };
    (apiClient.promoters.register as jest.Mock).mockResolvedValue({ data: promoter });

    const { result } = renderHook(() => usePromoterRegistration());

    let returned: Promoter | undefined;
    await act(async () => {
      returned = await result.current.register(promoterPayload);
    });

    expect(returned).toEqual(promoter);
    expect(apiClient.promoters.register).toHaveBeenCalledWith(promoterPayload);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN the API rejects WHEN register fails THEN it sets error and returns submitting to false", async () => {
    (apiClient.promoters.register as jest.Mock).mockRejectedValue(
      new ApiError("Dados inválidos.", 422),
    );

    const { result } = renderHook(() => usePromoterRegistration());

    await act(async () => {
      await result.current.register(promoterPayload);
    });

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(result.current.error).toBe("Dados inválidos.");
  });
});
