import { Reveal } from "@foundation/accessibility";
import { Container } from "@foundation/ui";

import { SectionHeading } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";

import { ContactForm } from "./contact-form";

/**
 * The last section, and the only one that asks for anything.
 *
 * ⚠️ IT USED TO BE A HEADING, A SENTENCE, AND TWO BARE INPUTS ON A FLAT PANEL.
 * Daniel: *"The last section with the 'Let's Talk' looks, I think, of the Photo
 * section looks completely trash."* There were three separate problems in it:
 *
 *   · NO FACE. This is the moment someone decides whether to hand over a phone
 *     number, and there was nobody on screen to hand it to. Her strongest
 *     photograph — the phone-and-blazer shot INTAKE.md calls the best available
 *     — was sitting unused in the repo.
 *   · NO ANSWER TO "AND THEN WHAT?". The form asked for a number and said
 *     nothing about what arrives afterwards, which is the objection that
 *     actually stops people at this exact point.
 * The aside now carries both, and the form is unchanged — it already worked, it
 * is already validated, and its contract with the Worker is not this
 * component's business.
 *
 * ⚠️ NO WHATSAPP LINK IN THIS SECTION, DELIBERATELY. One was added here and
 * then taken back out: `landing.spec.ts` asserts `.contact__whatsapp` has count
 * zero, and the rule behind that assertion is right. The lead form IS the
 * conversion path, a chat link beside it competes for the same click, and the
 * floating WhatsApp button is already on screen over this section anyway — so
 * the alternative was never missing, it was just already elsewhere. Reversing a
 * standing conversion decision was not what the redesign was asked to do.
 */
export function Contact({ content }: { content: SiteContent }) {
  const { contact } = content;

  return (
    <section aria-labelledby="contact-title" className="section" id="contact">
      <Container className="contact__layout">
        <Reveal className="contact__aside">
          <figure className="contact__portrait">
            <img
              alt={contact.portraitAlt}
              height={1800}
              loading="lazy"
              src={contact.portrait}
              width={1200}
            />
          </figure>

          {/* ⚠️ A TICKED LIST OF THREE ASSURANCES USED TO FOLLOW THIS HEADING
              and it was cut on 2026-08-07 — every line of it restated the lead
              sentence directly above. The reasoning is written out in full
              against the content, in `site-content.ts`. The "and then what?"
              objection this section has to answer is still answered: by
              `description` here, and by `labels.privacy` under the form. */}
          <div className="contact__pitch">
            <SectionHeading
              id="contact-title"
              lead={contact.description}
              lines={contact.titleLines}
            />
          </div>
        </Reveal>

        <Reveal delay={1}>
          <ContactForm content={content} />
        </Reveal>
      </Container>
    </section>
  );
}
