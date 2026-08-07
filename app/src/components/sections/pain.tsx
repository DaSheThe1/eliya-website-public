import { Container } from "@foundation/ui";

import { LineIcon } from "@/components/ui/line-icons";
import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";
import { revealClass } from "@/lib/reveal-class";

/**
 * The problem section. Each line is one sentence with its weight-bearing words
 * set heavier and in gold, so the list can be skimmed by reading only the
 * emphasis and still make sense.
 *
 * The glyphs are thin gold line icons in a ringed plate, replacing the emoji
 * that used to sit here. See `ui/line-icons.tsx` for why.
 */
export function Pain({ content }: { content: SiteContent }) {
  const { pain } = content;

  return (
    <section aria-labelledby="pain-title" className="section pain" id="pain">
      <Container>
        <SectionHeading
          id="pain-title"
          lead={pain.description}
          lines={pain.titleLines}
        />
        <ul className="pain__grid">
          {pain.items.map((item, index) => {
            const [before, after] = item.text.split(item.emphasis);
            return (
              <li
                className={revealClass((index % 4) + 1, "pain__item")}
                key={item.id}
              >
                <span aria-hidden className="pain__icon">
                  <LineIcon name={item.icon} />
                </span>
                <p className="pain__text">
                  {before}
                  <strong className="pain__emphasis">{item.emphasis}</strong>
                  {after}
                </p>
              </li>
            );
          })}
        </ul>
        <SectionCta cta={pain.cta} />
      </Container>
    </section>
  );
}
