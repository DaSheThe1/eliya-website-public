import { Container } from "@foundation/ui";

import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";
import { revealClass } from "@/lib/reveal-class";

export function Testimonials({ content }: { content: SiteContent }) {
  const { testimonials } = content;

  return (
    <section
      aria-labelledby="testimonials-title"
      className="section section--tight section--band-warm"
    >
      <Container>
        <SectionHeading
          id="testimonials-title"
          lines={testimonials.titleLines}
        />
        <div className="testimonials__grid">
          {testimonials.items.map((item, index) => (
            <figure className={revealClass(index + 1, "quote")} key={item.id}>
              <blockquote>{item.quote}</blockquote>
              <figcaption>{item.attribution}</figcaption>
            </figure>
          ))}
        </div>
        <SectionCta cta={testimonials.cta} />
      </Container>
    </section>
  );
}
