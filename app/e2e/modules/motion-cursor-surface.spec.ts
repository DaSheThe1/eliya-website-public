import { expect, test } from "@playwright/test";

import { pagePath, testSite } from "../site-fixture";

/**
 * motion-cursor-surface contract:
 *   decorative and aria-hidden · requires a real fine pointer ·
 *   stops at rest · never intercepts input.
 */
test.describe("motion-cursor-surface", () => {
  test("is decorative and never intercepts pointer input", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const surface = page.locator(".cursor-surface");
    await expect(surface).toHaveAttribute("aria-hidden", "true");
    await expect(surface).toHaveCSS("pointer-events", "none");
  });

  test("activates on a fine pointer and stops at rest", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const surface = page.locator(".cursor-surface");

    /*
     * The listener is attached on hydration. Moving the pointer before that
     * lands on a page with nothing listening, so wait for the client bundle.
     *
     * ⚠️ SCROLL FIRST, AT EVERY WIDTH. This assertion is only a hydration
     * signal, and it works by observing that the hero CTA has been SEEN — so it
     * cannot fire until the CTA is on screen. Whether it happens to be on the
     * first screen depends on how tall the hero is, which is a design decision
     * that changes. It changed on 2026-08-06, when the player was resized to
     * match Pnina's, and this spec failed at desktop widths for the first time.
     *
     * Making the page fit the test was the wrong fix and it had already been
     * made once: the hero player was sized by viewport height for weeks purely
     * so this line would pass without a scroll. Scroll to the element instead.
     */
    await page.locator(".hero__actions").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-cta-emphasis]").first()).toHaveAttribute(
      "data-cta-emphasis",
      "played",
    );

    await page.mouse.move(400, 300);
    await page.mouse.move(520, 380);
    await expect(surface).toHaveAttribute("data-active", "true");

    // Idle timeout is 900ms; after it the surface must fade back out.
    await page.waitForTimeout(1400);
    await expect(surface).toHaveAttribute("data-active", "false");
  });

  test("never activates for touch-only input", async ({ browser }) => {
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { height: 844, width: 390 },
    });
    const page = await context.newPage();
    await page.goto(pagePath(testSite.defaultLocale));

    /*
     * ⚠️ SCROLL FIRST. This assertion is only a hydration signal — it waits for
     * the client bundle before the tap below means anything — and it works by
     * observing that the hero CTA has been seen. On a 390x844 phone the hero
     * clip is sized by WIDTH, so the actions sit below the fold and the
     * IntersectionObserver behind `data-cta-emphasis` correctly never fires
     * until they are scrolled to. Waiting on a signal that is designed not to
     * fire yet is the test's bug, not the component's.
     */
    await page.locator(".hero__actions").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-cta-emphasis]").first()).toHaveAttribute(
      "data-cta-emphasis",
      "played",
    );

    await page.touchscreen.tap(180, 400);
    await page.waitForTimeout(400);
    await expect(page.locator(".cursor-surface")).toHaveAttribute(
      "data-active",
      "false",
    );
    await context.close();
  });
});
