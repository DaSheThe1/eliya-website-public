import { expect, test } from "@playwright/test";

import { headlineText } from "../../src/components/ui/section-heading";
import { getSiteContent } from "../../src/content";
import { pagePath, testSite } from "../site-fixture";

const content = getSiteContent("he");

test.describe("Eliya landing page", () => {
  test("renders the hero, offer and lead form in Hebrew RTL", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(
      page.getByRole("heading", { level: 1, name: content.hero.titleLines.join(" ") }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: headlineText(content.offer.titleLines),
      }),
    ).toBeVisible();
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-phone")).toBeVisible();
  });

  test("shows the proof as two galleries split by media kind", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));

    /*
     * ⚠️ THIS SPEC USED TO ASSERT A 12-TILE WALL. Daniel replaced that design
     * on 2026-08-05: *"There is still no gallery in the social proof section
     * like this gallery that is switching and then you can press the right and
     * left arrows […] Could be a gallery where it is like two rows […] one for
     * audio/video and one for regular images."* The wall's own failure was that
     * eleven screenshots four-across rendered ~200px wide and could not be
     * read.
     *
     * Every artefact is now on the page at once, across two tracks, rather than
     * twelve of them cycling. The volume argument survives; the unreadability
     * does not.
     */
    const stills = content.proof.items.filter(
      (item) => item.media.kind === "image",
    );
    const media = content.proof.items.filter(
      (item) => item.media.kind !== "image",
    );

    await expect(page.locator(".gallery")).toHaveCount(2);
    await expect(page.locator(".proof__tile")).toHaveCount(
      content.proof.items.length,
    );
    await expect(
      page.locator('.gallery__tile[data-kind="image"]'),
    ).toHaveCount(stills.length);
    await expect(
      page.locator('.gallery__tile:not([data-kind="image"])'),
    ).toHaveCount(media.length);
    await expect(page.locator(".gallery__card").first()).toBeVisible();
  });

  test("the proof galleries step with the arrows", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));

    const gallery = page.locator(".gallery").first();
    const track = page.locator(".gallery__track").first();
    await track.scrollIntoViewIfNeeded();

    /*
     * ⚠️ HOVER FIRST, AND IT IS LOAD-BEARING RATHER THAN COSMETIC.
     *
     * This gallery auto-advances on an interval and pauses on pointer enter
     * (`sections/gallery.tsx`). Without the hover the test is racing that
     * interval, and the failure it produces is a liar: `step()` WRAPS to zero
     * at the end of the track, so an auto-advance landing between the two
     * samples can return `scrollLeft` to exactly where it started. The
     * assertion then reports that the arrow does not move the track while the
     * arrow is working perfectly. Hovering silences the only other mover, so
     * whatever this measures afterwards was caused by the click.
     */
    await gallery.hover();

    // ⚠️ NOT A FIXED WAIT. Both of these were `waitForTimeout` — 300ms to
    // settle and 900ms for the step — and a smooth scroll on a loaded machine
    // under parallel workers is not bounded by either number. Sample a position
    // that has stopped moving, then poll for it to change.
    const restingScrollLeft = async () => {
      let last = Number.NaN;
      await expect
        .poll(async () => {
          const now = await track.evaluate((node) => node.scrollLeft);
          const stable = now === last;
          last = now;
          return stable;
        })
        .toBe(true);
      return last;
    };

    const before = await restingScrollLeft();

    await gallery
      .getByRole("button", { name: content.proof.nextLabel })
      .click();

    await expect
      .poll(async () => track.evaluate((node) => node.scrollLeft))
      .not.toBe(before);
  });

  test("a still opens full size in the viewer", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));

    await page.locator("#proof").scrollIntoViewIfNeeded();
    await page.locator(".gallery__expand").first().click();

    const viewer = page.locator("dialog.viewer");
    await expect(viewer).toBeVisible();
    await expect(viewer.locator(".viewer__image")).toBeVisible();

    // Escape closes it, because the viewer is a real <dialog> and the browser
    // owns that behaviour rather than a hand-rolled key handler.
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("gallery clips use the site player, not the browser's", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    await page.locator("#proof").scrollIntoViewIfNeeded();

    /*
     * ⚠️ `controls` ON THESE TILES OFFERS **DOWNLOAD**. Chrome's overflow menu
     * puts a download item on any `<video controls>`, and these are her
     * clients' clips. It also drew an unstyled play bar, volume slider and
     * fullscreen button across her face inside an otherwise styled tile.
     *
     * Daniel, 2026-08-06: *"the video player of the gallery shouldn't have that
     * stuff like download and three-dot options."*
     */
    await expect(page.locator(".gallery__card video[controls]")).toHaveCount(0);

    const players = page.locator(".tile-video");
    await expect(players).toHaveCount(2);
    // Play/pause as a real button, and the progress line he asked for.
    await expect(players.first().locator(".tile-video__tap")).toBeVisible();
    await expect(players.first().locator(".tile-video__progress")).toHaveCount(1);
  });

  test("a gallery track with nothing to scroll shows no arrows", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    await page.locator("#proof").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Eleven stills overflow and get arrows; two clips fit and must not.
    const galleries = page.locator(".gallery");
    const stillsArrows = galleries.nth(0).locator(".gallery__arrow");
    const mediaArrows = galleries.nth(1).locator(".gallery__arrow");
    await expect(stillsArrows).toHaveCount(2);
    await expect(mediaArrows).toHaveCount(0);
  });

  test("both prices are struck and the call itself is free", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    await page.locator("#offer").scrollIntoViewIfNeeded();

    const rungs = page.locator(".free-anchor__rung");
    await expect(rungs).toHaveCount(content.offer.rungs.length);
    // Every rung carries an X, because neither price applies: nothing is sold
    // on this page.
    await expect(page.locator(".free-anchor__x")).toHaveCount(
      content.offer.rungs.length,
    );
    // The ladder lands on the REASON the call is free, not on a restatement of
    // the button underneath it. `freeNote` ("השיחה / ללא עלות") was removed on
    // 2026-08-07 for saying the same thing as the CTA one element away.
    await expect(page.locator(".free-anchor__free")).toHaveText(
      content.offer.freeLabel,
    );
  });

  test("puts whatsapp on the right and accessibility on the left", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const width = page.viewportSize()?.width ?? 1280;
    const whatsapp = await page.locator(".floating-whatsapp").boundingBox();
    const a11y = await page.locator(".a11y-launcher").boundingBox();
    // The page is RTL, so a logical `inset-inline-end` would put these on the
    // wrong physical side. This asserts the physical edge.
    expect(whatsapp!.x).toBeGreaterThan(width / 2);
    expect(a11y!.x).toBeLessThan(width / 2);
  });

  test("keeps the header and its call to action visible on a phone", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { height: 844, width: 390 },
    });
    const page = await context.newPage();
    await page.goto(pagePath(testSite.defaultLocale));

    await expect(page.locator(".site-header")).toBeVisible();
    await expect(page.locator(".site-menu-toggle")).toBeVisible();

    await page.locator(".site-menu-toggle").click();
    await expect(page.locator(".site-drawer")).toBeVisible();
    await context.close();
  });

  test("quotes the written testimonials verbatim", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    for (const item of content.testimonials.items) {
      // Two of the three also ride in the proof carousel as quote slides, so
      // this asserts presence rather than uniqueness.
      await expect(
        page.getByText(item.quote, { exact: true }).first(),
      ).toBeVisible();
    }
  });

  test("uses no em dashes or gershayim as punctuation", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    const text = await page.locator("main").innerText();
    for (const banned of ["\u2014", "\u2013", "\u05F4", "\u2033"]) {
      expect(text).not.toContain(banned);
    }
  });

  test("keeps essential content available without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(pagePath(testSite.defaultLocale));

    await expect(
      page.getByRole("heading", { level: 1, name: content.hero.titleLines.join(" ") }),
    ).toBeVisible();
    await expect(page.locator(".proof__tile").first()).toBeVisible();
    await expect(page.locator("#contact-phone")).toBeVisible();
    await context.close();
  });

  test("keeps whatsapp to the floating button and the footer", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    await expect(page.locator(".floating-whatsapp")).toHaveAttribute(
      "href",
      /api\.whatsapp\.com\/send/,
    );
    // The lead form is the conversion path; the contact section does not offer
    // a competing channel beside it.
    await expect(page.locator(".contact__whatsapp")).toHaveCount(0);
  });

  test("closes every argued section with its own invitation", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));

    /*
     * ⚠️ THIS ASSERTS THE LABELS ARE ALL DIFFERENT, not just that they exist.
     *
     * Measured 2026-08-06 before the change: four calls to action across
     * thirteen sections, and the hero's primary button and the offer's button
     * were the identical string "לשיחה איתי, ללא עלות". Daniel: *"I also don't
     * see that we have a CTA after each section. And most CTAs should be
     * different, like different text."*
     *
     * The count is the easy half. Uniqueness is the half that decays silently:
     * the cheapest way to add a call to action to a new section is to paste the
     * last one, and a page that repeats one label nine times teaches the reader
     * to stop seeing it.
     */
    const labels = await page
      .locator(".section__cta .ui-button")
      .allInnerTexts();

    expect(labels.length).toBeGreaterThanOrEqual(8);
    expect(new Set(labels).size).toBe(labels.length);

    // And none of them may borrow the offer's line, which is the one place the
    // button is allowed to name the transaction directly.
    expect(labels).not.toContain(content.offer.cta);
  });

  test("headings break at sentence ends, not wherever the box does", async ({
    page,
  }) => {
    await page.goto(pagePath(testSite.defaultLocale));

    /*
     * Daniel's standing format rule: a line ends where a sentence ends. Every
     * section heading is an array of finished sentences and each entry gets its
     * own block, so this asserts the structure rather than the pixels — a
     * heading rendered as one run of text is one that has lost the rule.
     */
    for (const [id, lines] of [
      ["pain-title", content.pain.titleLines],
      ["proof-title", content.proof.titleLines],
      ["contact-title", content.contact.titleLines],
      // Single-sentence headings must NOT be broken: the array is for
      // sentences, not for cutting a phrase in half.
      ["method-title", content.method.titleLines],
      ["stats-title", content.stats.titleLines],
      ["faq-title", content.faq.titleLines],
    ] as const) {
      // One <br> per break, since the whole heading is a single glossed run so
      // that one crest can cross it. See ui/section-heading.tsx.
      await expect(page.locator(`#${id} br`)).toHaveCount(lines.length - 1);
      await expect(page.locator(`#${id} .wave-text__label`)).toHaveText(
        lines.join(" "),
      );
    }
  });

  test("uses no decorative eyebrow labels above headings", async ({ page }) => {
    await page.goto(pagePath(testSite.defaultLocale));
    await expect(page.locator(".ui-eyebrow")).toHaveCount(0);
  });
});
