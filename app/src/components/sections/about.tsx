import { Container } from "@foundation/ui";

import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";
import { revealClass } from "@/lib/reveal-class";

/**
 * About sits directly under the hero: someone who has just watched her talk
 * wants to know who she is before they are asked for anything.
 *
 * ⚠️ THE PHOTOGRAPH IS NOW FRAMED AND BESIDE THE COPY, NOT A THUMBNAIL UNDER
 * IT. It used to be a 19rem-wide `<img>` with a 1px border, centred below a
 * narrow text column, with a grey caption. Daniel: *"we have the image there
 * and everything is looking horrific: not well placed, no special backgrounds
 * […] There is no panoramic or picture frame to that picture that will make it
 * look nice."*
 *
 * What it gets instead, all of it in `.about__frame` in globals.css:
 *
 *   · a mounted PLATE it sits on, not bare canvas — a gold-washed gradient
 *     panel a little larger than the picture, so the photo reads as hung
 *     rather than pasted;
 *   · a double frame: a gold hairline on the outside and an inset ring just
 *     inside the image edge, which is what a real frame does and what a single
 *     1px border cannot fake;
 *   · an inner vignette, so the pale sky at the top of this particular
 *     photograph stops colliding with the dark page;
 *   · the caption on the plate, in champagne rather than muted grey.
 *
 * The photo is 1400x1866 (3:4), so the frame is 3:4 and nothing is cropped.
 *
 * ⚠️ Framing does not fix the photograph. INTAKE.md O-10 still stands: one
 * usable image is carrying this whole page, and the frame below is making the
 * most of a weak slot rather than closing it.
 */
export function About({ content }: { content: SiteContent }) {
  const { about } = content;

  return (
    <section aria-labelledby="about-title" className="section section--band about" id="about">
      <Container className="about__layout">
        <div className="about__copy">
          <SectionHeading id="about-title" lines={about.titleLines} />
          {about.paragraphs.map((paragraph, index) => (
            <p className={revealClass(index + 1)} key={paragraph.slice(0, 24)}>
              {paragraph}
            </p>
          ))}
        </div>

        <figure className="about__frame">
          <div className="about__plate">
            <img
              alt={about.imageAlt}
              className="about__photo"
              height={1866}
              loading="lazy"
              src={about.image}
              width={1400}
            />
            <span aria-hidden className="about__vignette" />
            <span aria-hidden className="about__ring" />
          </div>
          <figcaption className="about__caption">
            {about.imageCaption}
          </figcaption>
        </figure>
      </Container>
      <Container>
        <SectionCta cta={about.cta} />
      </Container>
    </section>
  );
}
