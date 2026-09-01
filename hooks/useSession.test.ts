import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSession } from "./useSession";
import * as client from "../lib/api/client";
import { ApiError, UnauthenticatedError } from "../lib/api/http";
import type { AdminSessionAccount, Venue, Promoter } from "../lib/api/types";

vi.mock("../lib/api/client");

const mockedClient = vi.mocked(client);

function makeAccount(overrides?: Partial<AdminSessionAccount>): AdminSessionAccount {
  return {
    id: 1,
    name: "Admin",
    email: "admin@qor.com",
    permissions: [],
    account_type: "super_admin",
    ...overrides,
  };
}

function makeVenue(overrides?: Partial<Venue>): Venue {
  return {
    id: 1,
    name: "Casa X",
    description: "desc",
    address: "Rua A",
    city: "vitoria" as never,
    contact_phone: "1",
    contact_email: "a@a.com",
    approval_status: "approved" as never,
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
    approval_status: "approved" as never,
    ...overrides,
  };
}

describe("useSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN getMe resolves with a super_admin account WHEN the hook mounts THEN it exposes the account with no venue/promoter fetch", async () => {
    mockedClient.getMe.mockResolvedValue({ data: makeAccount() });

    const { result } = renderHook(() => useSession());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.account).toEqual(makeAccount());
    expect(result.current.venue).toBeNull();
    expect(result.current.promoter).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockedClient.getVenueProfile).not.toHaveBeenCalled();
    expect(mockedClient.getPromoterProfile).not.toHaveBeenCalled();
  });

  test("GIVEN getMe resolves with a venue_admin account WHEN the hook mounts THEN it also fetches and exposes the venue profile", async () => {
    mockedClient.getMe.mockResolvedValue({ data: makeAccount({ account_type: "venue_admin" }) });
    mockedClient.getVenueProfile.mockResolvedValue({ data: makeVenue() });

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.account).toEqual(makeAccount({ account_type: "venue_admin" }));
    expect(result.current.venue).toEqual(makeVenue());
    expect(result.current.promoter).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockedClient.getPromoterProfile).not.toHaveBeenCalled();
  });

  test("GIVEN getMe resolves with a promoter account WHEN the hook mounts THEN it also fetches and exposes the promoter profile", async () => {
    mockedClient.getMe.mockResolvedValue({ data: makeAccount({ account_type: "promoter" }) });
    mockedClient.getPromoterProfile.mockResolvedValue({ data: makePromoter() });

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.account).toEqual(makeAccount({ account_type: "promoter" }));
    expect(result.current.promoter).toEqual(makePromoter());
    expect(result.current.venue).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockedClient.getVenueProfile).not.toHaveBeenCalled();
  });

  test("GIVEN getMe rejects with UnauthenticatedError WHEN the hook mounts THEN it leaves account null without setting an error", async () => {
    mockedClient.getMe.mockRejectedValue(new UnauthenticatedError("Não autenticado."));

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.account).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.venue).toBeNull();
    expect(result.current.promoter).toBeNull();
  });

  test("GIVEN getMe rejects with a non-auth ApiError WHEN the hook mounts THEN it surfaces the error message", async () => {
    mockedClient.getMe.mockRejectedValue(new ApiError(500, "Erro inesperado."));

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.account).toBeNull();
    expect(result.current.error).toBe("Erro inesperado.");
  });
});
