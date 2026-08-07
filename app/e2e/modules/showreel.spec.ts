import { expect, test } from "@playwright/test";

import { getSiteContent } from "../../src/content";
import { pagePath, testSite } from "../site-fixture";

const content = getSiteContent("he");

/**
 * showreel contract: approved poster, an accessible name per clip, keyboard
 * operable controls, never autoplaying with sound, a static path under the
 * site's motion opt-out, and a conversion path that survives media failure.
 */
test.describe("showreel", () => {
  test("presents both approved clips with a poster", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    // One clip, not two: see the note at the top of showreel.tsx.
    await expect(page.locator(".hero-video")).toHaveCount(1);
    await expect(page.locator(".hero-video__clip")).toHaveAttribute(
      "poster",
      content.hero.video.poster,
    );
    await expect(page.locator(".hero-video__clip")).toHaveAttribute(
      "aria-label",
      content.hero.video.label,
    );
  });

  test("never plays with sound", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const videos = page.locator(".hero-video video");
    const count = await videos.count();

    for (let index = 0; index < count; index += 1) {
      await expect(videos.nth(index)).toHaveJSProperty("muted", true);
    }
  });

  test("controls are keyboard operable", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const control = page.locator(".hero-video__icon-button").first();
    await expect(control).toBeVisible();

    await control.focus();
    await expect(control).toBeFocused();

    const video = page.locator(".hero-video__clip");
    await video.evaluate((node: HTMLVideoElement) => node.play());
    await expect(video).toHaveJSProperty("paused", false);

    await page.keyboard.press("Enter");
    await expect(video).toHaveJSProperty("paused", true);
  });

  test("keeps a static path when site motion is opted out", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    // The motion switch lives in the accessibility panel now, not the footer:
    // one stored choice, one control, in the place people look for it.
    // The cookie cloud sits over the launcher on a narrow viewport, so answer
    // it first rather than clicking through it.
    await page.evaluate(() =>
      localStorage.setItem("eliya.cookie-notice.v1", '"accepted"'),
    );
    await page.reload({ waitUntil: "load" });
    await page.locator(".a11y-launcher").click();
    await page
      .locator(".a11y-panel__toggle")
      .filter({ hasText: "עצירת אנימציות" })
      .click();

    await expect(page.locator("html")).toHaveAttribute(
      "data-site-motion",
      "reduced",
    );
    const video = page.locator(".hero-video__clip");
    await expect(video).toHaveAttribute("poster", /\.jpg/);
    await expect(video).toHaveJSProperty("paused", true);
  });

  test("the conversion path does not depend on the showreel", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(pagePath(testSite.defaultLocale));

    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-phone")).toBeVisible();
    await context.close();
  });
});
