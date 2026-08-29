import { act, renderHook } from "@testing-library/react";

import type { Promoter, RegisterPromoterPayload, RegisterVenuePayload, Venue } from "@/lib/api/types";

import { usePromoterRegistration, useVenueRegistration } from "../useRegistration";

/**
 * Integration tests for the registration hooks: unlike useRegistration.test.ts
 * (which mocks `apiClient` directly), these mock the network boundary
 * (`global.fetch`) and exercise the real, un-mocked `apiClient` together
 * with the hook.
 */

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

function mockFetchOnce(status: number, body: unknown) {
  const text = JSON.stringify(body);
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  });
}

describe("useVenueRegistration (integration)", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GIVEN fetch resolves with a successful venue payload WHEN register is called THEN it resolves with the created venue and clears submitting state", async () => {
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
    mockFetchOnce(200, { data: venue });

    const { result } = renderHook(() => useVenueRegistration());

    let returned: Venue | undefined;
    await act(async () => {
      returned = await result.current.register(venuePayload);
    });

    expect(returned).toEqual(venue);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/venues/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN fetch resolves non-2xx with a pt-BR message WHEN register is called THEN error is set to that message", async () => {
    mockFetchOnce(422, { message: "E-mail já cadastrado.", errors: { registration_email: ["já em uso"] } });

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

describe("usePromoterRegistration (integration)", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GIVEN fetch resolves with a successful promoter payload WHEN register is called THEN it resolves with the created promoter and clears submitting state", async () => {
    const promoter: Promoter = {
      id: 1,
      name: "Produtora X",
      contact_phone: "27999999999",
      contact_email: "promoter@qor.app",
      instagram: null,
      tiktok: null,
      approval_status: "pending_approval",
    };
    mockFetchOnce(200, { data: promoter });

    const { result } = renderHook(() => usePromoterRegistration());

    let returned: Promoter | undefined;
    await act(async () => {
      returned = await result.current.register(promoterPayload);
    });

    expect(returned).toEqual(promoter);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/promoters/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN fetch resolves non-2xx with a pt-BR message WHEN register is called THEN error is set to that message", async () => {
    mockFetchOnce(422, { message: "Dados inválidos.", errors: { contact_email: ["inválido"] } });

    const { result } = renderHook(() => usePromoterRegistration());

    let returned: Promoter | undefined;
    await act(async () => {
      returned = await result.current.register(promoterPayload);
    });

    expect(returned).toBeUndefined();
    expect(result.current.error).toBe("Dados inválidos.");
    expect(result.current.isSubmitting).toBe(false);
  });
});
