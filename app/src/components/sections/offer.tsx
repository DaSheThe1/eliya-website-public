import { Container, buttonStyles } from "@foundation/ui";

import { FreeCallAnchor } from "@/components/motion/free-call-anchor";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";
import { siteUrl } from "@/lib/site-url";

/**
 * The funnel beat. Both prices are struck because neither applies: nothing is
 * sold on this page, and the ladder exists to make the free call read as worth
 * something rather than as worth nothing.
 *
 * The numbers are Daniel's placeholders for funnel shape, not Eliya's. The
 * on-screen disclaimer that used to sit under this panel is gone at his
 * instruction; the brief still carries the release blocker, so they cannot
 * ship as real prices without being replaced.
 */
export function Offer({ content }: { content: SiteContent }) {
  const { offer } = content;

  return (
    <section aria-labelledby="offer-title" className="section offer" id="offer">
      <Container>
        <div className="offer__panel">
          <SectionHeading
            id="offer-title"
            lead={offer.description}
            lines={offer.titleLines}
          />

          <FreeCallAnchor
            freeLabel={offer.freeLabel}
            rungs={offer.rungs}
          >
            <a className={buttonStyles()} href={siteUrl("#contact")}>
              {offer.cta}
            </a>
          </FreeCallAnchor>
        </div>
      </Container>
    </section>
  );
}
