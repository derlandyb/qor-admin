import { describe, expect, test, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useGenres } from "./useGenres";
import * as client from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Genre } from "../lib/api/types";

vi.mock("../lib/api/client");

const mockedClient = vi.mocked(client);

function makeGenre(overrides?: Partial<Genre>): Genre {
  return {
    id: 1,
    name: "Rock",
    slug: "rock",
    is_active: true,
    ...overrides,
  };
}

describe("useGenres", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN the hook mounts WHEN listGenres resolves THEN it exposes the genres and stops loading", async () => {
    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre()] });

    const { result } = renderHook(() => useGenres());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.genres).toEqual([makeGenre()]);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN listGenres rejects WHEN the hook mounts THEN it surfaces the ApiError message and clears genres", async () => {
    mockedClient.listGenres.mockRejectedValue(new ApiError(500, "Erro interno."));

    const { result } = renderHook(() => useGenres());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.genres).toEqual([]);
    expect(result.current.error).toBe("Erro interno.");
  });

  test("GIVEN a loaded list WHEN create resolves THEN it refetches the genre list", async () => {
    mockedClient.listGenres.mockResolvedValue({ data: [] });
    mockedClient.createGenre.mockResolvedValue({ data: makeGenre() });

    const { result } = renderHook(() => useGenres());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre()] });
    await act(async () => {
      await result.current.create({ name: "Rock" });
    });

    expect(mockedClient.createGenre).toHaveBeenCalledWith({ name: "Rock" });
    expect(result.current.genres).toEqual([makeGenre()]);
  });

  test("GIVEN a loaded list WHEN update resolves THEN it refetches the genre list", async () => {
    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre()] });
    mockedClient.updateGenre.mockResolvedValue({ data: makeGenre({ name: "Rock Nacional" }) });

    const { result } = renderHook(() => useGenres());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre({ name: "Rock Nacional" })] });
    await act(async () => {
      await result.current.update(1, { name: "Rock Nacional" });
    });

    expect(mockedClient.updateGenre).toHaveBeenCalledWith(1, { name: "Rock Nacional" });
    expect(result.current.genres).toEqual([makeGenre({ name: "Rock Nacional" })]);
  });

  test("GIVEN a loaded list WHEN activate resolves THEN it refetches the genre list", async () => {
    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre({ is_active: false })] });
    mockedClient.activateGenre.mockResolvedValue({ data: makeGenre({ is_active: true }) });

    const { result } = renderHook(() => useGenres());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre({ is_active: true })] });
    await act(async () => {
      await result.current.activate(1);
    });

    expect(mockedClient.activateGenre).toHaveBeenCalledWith(1);
    expect(result.current.genres).toEqual([makeGenre({ is_active: true })]);
  });

  test("GIVEN a loaded list WHEN deactivate resolves THEN it refetches the genre list", async () => {
    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre()] });
    mockedClient.deactivateGenre.mockResolvedValue({ data: makeGenre({ is_active: false }) });

    const { result } = renderHook(() => useGenres());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listGenres.mockResolvedValue({ data: [makeGenre({ is_active: false })] });
    await act(async () => {
      await result.current.deactivate(1);
    });

    expect(mockedClient.deactivateGenre).toHaveBeenCalledWith(1);
    expect(result.current.genres).toEqual([makeGenre({ is_active: false })]);
  });
});
