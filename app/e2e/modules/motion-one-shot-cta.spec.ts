import { expect, test } from "@playwright/test";

import { pagePath, testSite } from "../site-fixture";

/**
 * motion-one-shot-cta contract:
 *   the finished state is the base state · one pass per entry ·
 *   re-arms only after a full exit · never loops.
 */
test.describe("motion-one-shot-cta", () => {
  test("the call to action is usable before any emphasis runs", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(pagePath(testSite.defaultLocale));

    const cta = page.locator("[data-cta-emphasis] a").first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /#contact$/);
    await context.close();
  });

  test("emphasis plays once and does not loop", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const wrapper = page.locator("[data-cta-emphasis]").first();
    // The emphasis is driven by an IntersectionObserver, so it fires when the
    // wrapper is seen. Scroll to it rather than assuming the hero is short
    // enough to put it on the first screen.
    await wrapper.scrollIntoViewIfNeeded();
    await expect(wrapper).toHaveAttribute("data-cta-emphasis", "played");

    const iterations = await wrapper
      .locator("a")
      .first()
      .evaluate(
        (node) => getComputedStyle(node).animationIterationCount,
      );
    expect(["1", "none"]).toContain(iterations);
  });

  test("re-arms only after the element has fully left the viewport", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const wrapper = page.locator("[data-cta-emphasis]").first();
    // The emphasis is driven by an IntersectionObserver, so it fires when the
    // wrapper is seen. Scroll to it rather than assuming the hero is short
    // enough to put it on the first screen.
    await wrapper.scrollIntoViewIfNeeded();
    await expect(wrapper).toHaveAttribute("data-cta-emphasis", "played");

    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(wrapper).toHaveAttribute("data-cta-emphasis", "idle");

    // ⚠️ Back to the WRAPPER, not to `#hero-title`. The heading and the actions
    // are at opposite ends of the hero and the player between them is now
    // 566px tall, so scrolling the title into view no longer brings the actions
    // with it — the observer would correctly never re-fire and this would read
    // as a component fault rather than as the test aiming at the wrong element.
    await wrapper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await expect(wrapper).toHaveAttribute("data-cta-emphasis", "played");
  });
});
