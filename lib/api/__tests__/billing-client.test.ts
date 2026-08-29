import { apiClient } from "../client";

function mockFetchOnce(body: unknown, init?: { status?: number }) {
  const status = init?.status ?? 200;
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch;
}

describe("apiClient plan/subscription request builders (AT24)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GIVEN plans.list is called THEN it GETs /api/admin/plans", async () => {
    mockFetchOnce({ data: [] });

    await apiClient.plans.list();

    expect(fetch).toHaveBeenCalledWith("/api/admin/plans", expect.anything());
  });

  test("GIVEN a new plan payload WHEN plans.create is called THEN it POSTs JSON to /api/admin/plans", async () => {
    mockFetchOnce({ data: { id: 1 } }, { status: 201 });

    await apiClient.plans.create({ name: "Pro", monthly_price: 49.9, publish_quota: 20 });

    const [url, init] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/admin/plans");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ name: "Pro" });
  });

  test("GIVEN a plan update WHEN plans.update is called THEN it PATCHes /api/admin/plans/{id}", async () => {
    mockFetchOnce({ data: { id: 3 } });

    await apiClient.plans.update(3, { name: "Pro+", monthly_price: 59.9, publish_quota: 30 });

    const [url, init] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/admin/plans/3");
    expect(init.method).toBe("PATCH");
  });

  test("GIVEN plans.deactivate is called THEN it POSTs to /api/admin/plans/{id}/deactivate", async () => {
    mockFetchOnce({ data: { id: 3, is_active: false } });

    await apiClient.plans.deactivate(3);

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/plans/3/deactivate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("GIVEN subscription.get is called THEN it GETs /api/admin/subscription", async () => {
    mockFetchOnce({
      data: {
        plan_name: "Free",
        monthly_price: 0,
        publish_quota: 5,
        publishes_used_this_period: 2,
        is_at_limit: false,
      },
    });

    await apiClient.subscription.get();

    expect(fetch).toHaveBeenCalledWith("/api/admin/subscription", expect.anything());
  });
});
