import { defineConfig, devices } from "@playwright/test";

/**
 * AT23 — runs exclusively inside the admin container (`make e2e-admin`,
 * see root Makefile) against the already-running `next dev` process on
 * this same container's localhost:3000, never on the host. The Next dev
 * server is always up already (it's the container's own CMD), so no
 * `webServer` block is configured here — this suite assumes the full
 * `make up` stack (api/admin/db/minio) is already running.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
