import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/e2e/"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    // Route handlers use next/headers' cookies(), which requires a real
    // Next.js request scope — unit-mocking it is brittle/low-value; these
    // are exercised for real by the Playwright E2E flow (AT23) instead.
    "!app/api/**",
    // Trivial framework glue (redirect-only root page, font/metadata-only
    // root layout) — no branching logic worth a unit test.
    "!app/layout.tsx",
    "!app/page.tsx",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 70,
    },
  },
};

export default createJestConfig(config);
