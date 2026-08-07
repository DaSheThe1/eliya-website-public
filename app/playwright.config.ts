import { defineConfig, devices } from "@playwright/test";

import {
  hasIntakeModule,
  pagePath,
  referenceOrigin,
  testSite,
  testPort,
} from "./e2e/site-fixture";

const readinessPath = pagePath(testSite.defaultLocale);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `${referenceOrigin}${testSite.basePath}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${testPort}`,
    url: `${referenceOrigin}${readinessPath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_BASE_PATH: testSite.basePath,
      NEXT_PUBLIC_DEFAULT_LOCALE: testSite.defaultLocale,
      NEXT_PUBLIC_SITE_URL: referenceOrigin,
      DEPLOYMENT_PROFILE: testSite.deploymentProfile,
      INTAKE_MODE: hasIntakeModule ? "webhook" : "disabled",
      INTAKE_ALLOWED_ORIGINS:
        `${testSite.siteUrl},${referenceOrigin}`,
      INTAKE_WEBHOOK_URL: "https://127.0.0.1:1/foundation-test-intake",
      INTAKE_WEBHOOK_SIGNING_SECRET:
        "fictional-playwright-signing-secret",
      INTAKE_DUPLICATE_SECRET:
        "fictional-playwright-duplicate-secret",
    },
  },
});
