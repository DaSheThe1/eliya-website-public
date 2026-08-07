import { expect, test } from "@playwright/test";

import { pagePath, testSite } from "../site-fixture";

/**
 * motion-hero-media contract:
 *   poster is real server markup · muted · Save-Data blocks every byte ·
 *   the pause control is always present · a visitor who pauses stays paused.
 */
test.describe("motion-hero-media", () => {
  test("renders the clip with a poster and muted playback", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    // One clip in the hero, not two: see the note at the top of showreel.tsx.
    // Two <video> elements by design: the clip, and a blurred copy behind it
    // filling the letterbox. Only the clip is addressable.
    const video = page.locator(".hero-video__clip");
    await expect(video).toHaveCount(1);
    await expect(page.locator(".hero-video__backdrop")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(video).toHaveAttribute("poster", /\/media\/video\/.+\.jpg/);
    await expect(video).toHaveJSProperty("muted", true);
    await expect(video).toHaveJSProperty("playsInline", true);
  });

  test("keeps the poster in server HTML so the frame never shifts", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(pagePath(testSite.defaultLocale));
    await expect(page.locator(".hero-video__clip")).toHaveAttribute(
      "poster",
      /\.jpg/,
    );
    await context.close();
  });

  test("a paused clip is not restarted behind the visitor", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const video = page.locator(".hero-video__clip");
    // Before sound is taken, the corner carries a pause twin; that is WCAG
    // 2.2.2 for a clip that autoplays and runs longer than five seconds.
    const control = page.locator(".hero-video__icon-button").first();

    await expect(control).toBeVisible();
    await video.evaluate((node: HTMLVideoElement) => node.play());
    await expect(video).toHaveJSProperty("paused", false);

    await control.click();
    await expect(video).toHaveJSProperty("paused", true);

    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(700);
    await expect(video).toHaveJSProperty("paused", true);
  });

  test("pressing play with sound restarts the clip from the beginning", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const clip = page.locator(".hero-video__clip");

    /*
     * ⚠️ THE CLIP IS ALREADY RUNNING BEFORE ANYONE PRESSES ANYTHING. It
     * autoplays muted and loops as a silent preview, so by the time a visitor
     * decides to hear it, playback is wherever the loop happens to have reached
     * — which depends only on how long they spent reading the headline. On a
     * sixty second clip that can be four seconds from the end.
     *
     * Daniel, 2026-08-06: *"playing the video for the first time, hitting play
     * should restart it, like start from 0:00."*
     *
     * So this waits for the preview to get meaningfully into the clip FIRST.
     * Asserting the rewind against a clip that never advanced would pass
     * whether or not the fix exists.
     */
    await expect
      .poll(() => clip.evaluate((node: HTMLVideoElement) => node.currentTime), {
        timeout: 15_000,
      })
      .toBeGreaterThan(1.5);

    await page.locator(".hero-video__unmute").click();

    const afterPress = await clip.evaluate(
      (node: HTMLVideoElement) => node.currentTime,
    );
    expect(afterPress).toBeLessThan(1);
    await expect(clip).toHaveJSProperty("muted", false);
  });

  test("Save-Data blocks the clip and leaves the poster", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { "save-data": "on" },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true },
      });
    });
    await page.goto(pagePath(testSite.defaultLocale));

    const video = page.locator(".hero-video__clip");
    await expect(video).toHaveJSProperty("currentSrc", "");
    await expect(video).toHaveAttribute("poster", /\.jpg/);
    // Neither element may carry a source under Save-Data, backdrop included.
    await expect(page.locator(".hero-video source")).toHaveCount(0);
    await context.close();
  });
});
