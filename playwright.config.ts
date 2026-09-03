import { defineConfig, devices } from "@playwright/test";

/**
 * AT23 — runs in the dedicated `admin-e2e` container (`make e2e-admin`,
 * see root Makefile), built from `Dockerfile.e2e`, never on the host.
 * It reaches the `admin` service's `next dev` process over the Compose
 * network via `PLAYWRIGHT_BASE_URL` (falls back to localhost:3000 for
 * anyone running Playwright by hand inside the admin dev container).
 * No `webServer` block is configured — this suite assumes the full
 * `make up` stack (api/admin/db/minio) is already running.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
