import { buttonStyles } from "@foundation/ui";

import { LeadLink } from "@/components/lead/lead-link";
import type { SectionCta as SectionCtaContent } from "@/content";

/**
 * The call to action that closes a section.
 *
 * ⚠️ THERE WERE FOUR CALLS TO ACTION ON A THIRTEEN-SECTION PAGE, and two of
 * them were the same sentence. Measured 2026-08-06: hero(2), offer(1),
 * contact(1), everything else zero — and hero's primary and offer's button
 * both read `"לשיחה איתי, ללא עלות"`. Daniel: *"I also don't see that we have a
 * CTA after each section. And most CTAs should be different, like different
 * text."*
 *
 * Both halves of that matter, and the second is the harder one. A page that
 * repeats one button label nine times teaches the reader to stop seeing it. So
 * every `SectionCta` label in the content file is written to follow the section
 * it closes — after the problem section it answers the problem, after the proof
 * it answers the proof — and no two are the same string. There is a unit test
 * asserting that, because it is the kind of rule that decays silently.
 *
 * ⚠️ THE GOLD FILL, NOT THE QUIET OUTLINE.
 *
 * These shipped as `variant: "secondary"` on the reasoning that a section-
 * closing invitation is a step below the hero and the offer, and that styling
 * them identically would flatten the page's hierarchy. Daniel, 2026-08-06:
 * *"the extra CTAs you added don't have our CTA format of gold and other colors
 * and stuff."*
 *
 * He is right, and the reasoning above was solving the wrong problem. The
 * hierarchy argument only holds where two buttons compete IN THE SAME VIEW —
 * the hero has a primary and a secondary side by side, and there the contrast
 * is doing real work. These sit alone at the end of a section with nothing to
 * be quieter than. All the outline variant bought was eight buttons that did
 * not look like the site's buttons.
 *
 * They are still distinguishable from the hero and the offer: the labels are
 * all different (see below), and `.section__cta` sizes them a step down.
 */
export function SectionCta({ cta }: { cta: SectionCtaContent }) {
  return (
    <div className="section__cta">
      {/* ⚠️ `cta.href` IS NO LONGER READ HERE, AND THAT IS DELIBERATE. Every
          entry points at `#contact` (O-18) and now opens the popup instead of
          scrolling there. The field stays in the content type because it is
          what a second conversion path — a booking link, a WhatsApp flow —
          would use, and `LeadLink` keeps `#contact` as its no-JavaScript
          fallback either way. */}
      <LeadLink className={buttonStyles({ className: "section__cta-button" })}>
        {cta.label}
      </LeadLink>
    </div>
  );
}
