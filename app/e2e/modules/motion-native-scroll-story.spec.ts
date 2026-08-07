import { expect, test } from "@playwright/test";

import { pagePath, testSite } from "../site-fixture";

/**
 * motion-native-scroll-story contract:
 *   native scroll only · no body lock · no root scroll-snap ·
 *   stable server geometry · every station readable without JavaScript.
 */
test.describe("motion-native-scroll-story", () => {
  test("all stations are present and readable without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(pagePath(testSite.defaultLocale));

    const stations = page.locator(".scroll-story__station");
    await expect(stations).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await expect(stations.nth(index)).toBeVisible();
      // Full opacity at rest. Nothing is hidden waiting for an animation, and
      // no station is dimmed to make another one look brighter.
      await expect(stations.nth(index)).toHaveCSS("opacity", "1");
    }
    await context.close();
  });

  test("does not lock the body or install root scroll snap", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const locked = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const root = getComputedStyle(document.documentElement);
      return {
        bodyOverflowY: body.overflowY,
        bodyPosition: body.position,
        rootSnap: root.scrollSnapType,
      };
    });
    expect(locked.bodyPosition).not.toBe("fixed");
    expect(locked.bodyOverflowY).not.toBe("hidden");
    expect(["none", "none none"]).toContain(locked.rootSnap);
  });

  test("scrolling advances the active station without moving the page for the visitor", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    await page.locator(".stats").scrollIntoViewIfNeeded();

    /*
     * ⚠️ POLL FOR THE CONDITION; DO NOT GUESS AT TIMING.
     *
     * This has now been wrong twice, in opposite directions. It began as a
     * fixed `waitForTimeout(500)` before sampling and `700` after, which was
     * too short under parallel workers and failed with `6790 > 6790`. It was
     * then "hardened" with a helper that polled until two consecutive reads of
     * `scrollY` agreed — which is worse, because two reads 50ms apart agree
     * BEFORE a smooth scroll starts moving as readily as after it stops. That
     * version returned the pre-wheel position as the post-wheel one and failed
     * the same way, this time deterministically.
     *
     * The wheel itself was never the problem: measured directly at this scroll
     * position it moves the page 6842 -> 7242, exactly the delta requested.
     *
     * `expect.poll` waits for the assertion to become true instead of waiting
     * for a duration, so there is no number here to be wrong about.
     */
    const settled = async () => {
      let last = -1;
      for (let i = 0; i < 40; i += 1) {
        const now = await page.evaluate(() => window.scrollY);
        if (now === last) return now;
        last = now;
        await page.waitForTimeout(50);
      }
      return last;
    };

    const before = await settled();
    await page.mouse.wheel(0, 400);

    // The page moved: nothing hijacked the scroll.
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 })
      .toBeGreaterThan(before);

    // Lighting is cumulative and one-way: at least one station has been
    // reached, and none has been dimmed to pay for it.
    await expect(
      page.locator('.scroll-story__station[data-lit="true"]').first(),
    ).toBeVisible();
  });

  test("geometry is stable: station boxes do not resize as the story advances", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    await page.locator(".stats").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const measure = () =>
      page.$$eval(".scroll-story__station", (nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
      );

    const before = await measure();
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(700);
    const after = await measure();

    expect(after).toEqual(before);
  });
});
