import { defineConfig, devices } from "@playwright/test";

/**
 * AT23 — runs in the dedicated `admin-e2e` container (`make e2e-admin`,
 * see root Makefile), built from `Dockerfile.e2e`, never on the host.
 * That container shares the `admin` service's network namespace
 * (`network_mode: service:admin` in the root docker-compose.yml) rather
 * than reaching it over the Docker network by hostname — Next's dev
 * server and Sanctum's stateful-domain check both only trust `localhost`
 * by default, and this keeps that assumption true no matter which
 * container the browser itself runs in. No `webServer` block is
 * configured — this suite assumes the full `make up` stack
 * (api/admin/db/minio) is already running.
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
