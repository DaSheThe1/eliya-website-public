import { expect, test } from "@playwright/test";

import { pagePath, testSite } from "../site-fixture";

/**
 * remote-media-r2 contract, from the browser's side: the published boundary is
 * an allowlist, and the site keeps working from its build-time copy when the
 * bucket is not reachable.
 */
test.describe("remote-media-r2", () => {
  test("every media reference resolves from the published boundary", async ({
    page,
  }) => {
    const failures: string[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/media/") && response.status() >= 400) {
        failures.push(`${response.status()} ${url}`);
      }
    });

    await page.goto(pagePath(testSite.defaultLocale));
    await page.locator("#proof").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    expect(failures).toEqual([]);
  });

  test("media is served with a safe content type", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const response = await page.request.get(
      `${testSite.basePath}/media/proof/t01.jpg`,
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image");
  });

  test("the conversion path survives every media request failing", async ({
    page,
  }) => {
    await page.route("**/media/**", (route) => route.abort());
    await page.goto(pagePath(testSite.defaultLocale));

    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-phone")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });
});
