import { Container } from "@foundation/ui";

import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";

/**
 * ⚠️ THE OLD MARKUP PUT THE CONTROL AT THE OPPOSITE END OF THE ROW FROM THE
 * QUESTION. Daniel: *"The FAQ questions section looks completely garbage and
 * way off, UI/UX-wise."* Measured at 1440px, each row was a full-width card
 * with the question set at the start edge and a `+` floated to the far end,
 * leaving roughly 600px of empty card between the thing you read and the thing
 * you press. Nothing tied them together, and Fitts's law says that gap is paid
 * on every single interaction.
 *
 * What changed, in order of how much it matters:
 *
 *   1. The list is CONSTRAINED. A question is one line of text; a 1200px
 *      measure for one line is why the row looked empty in the first place.
 *   2. The chevron sits IMMEDIATELY BESIDE the question, both inside one
 *      flex row, so the target and the label are one object.
 *   3. `<summary>` is a flex container rather than a block with a float, which
 *      also removes the `::after` glyph that could not be positioned.
 *   4. The answer gets real typography and an indent that lines it up under
 *      the question rather than under the chevron.
 *
 * Still a `<details>`/`<summary>`: it opens with no JavaScript, it is
 * keyboard-operable for free, and find-in-page reaches closed answers in
 * browsers that support content-visibility search. There is no accordion
 * controller here on purpose — several open at once is a feature on a page
 * where the questions are objections and a reader may hold two at a time.
 */
export function Faq({ content }: { content: SiteContent }) {
  const { faq } = content;

  return (
    <section aria-labelledby="faq-title" className="section section--band faq" id="faq">
      <Container>
        <SectionHeading id="faq-title" lines={faq.titleLines} />

        <div className="faq__list">
          {faq.items.map((item) => (
            <details className="faq__item" key={item.question}>
              <summary className="faq__summary">
                <span className="faq__question">{item.question}</span>
                <span aria-hidden className="faq__chevron">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="m6 9 6 6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </summary>
              <div className="faq__answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
        <SectionCta cta={faq.cta} />
      </Container>
    </section>
  );
}
