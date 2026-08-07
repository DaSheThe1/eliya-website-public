import { Reveal } from "@foundation/accessibility";
import { Container } from "@foundation/ui";

import { ProcessSpine } from "@/components/motion/process-spine";
import { LineIcon } from "@/components/ui/line-icons";
import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";

export function Method({ content }: { content: SiteContent }) {
  const { method } = content;

  return (
    <section aria-labelledby="method-title" className="section section--band" id="method">
      <Container>
        <SectionHeading
          id="method-title"
          lead={method.description}
          lines={method.titleLines}
        />
        <div className="method__stack">
          <ProcessSpine steps={method.items.length} />
          <div className="method__grid">
          {method.items.map((item, index) => (
            <Reveal
              className="method__card card"
              delay={(index + 1) as 1 | 2 | 3}
              key={item.id}
            >
              {/*
                ⚠️ THE 01/02/03 IS GONE AND THE GLYPH IS NOW ON THE TITLE'S ROW.
                Daniel, 2026-08-06: *"In this section remove the 01, 02, 03
                numbers from each thing and make the icon and the header appear
                in the same row."*

                The numbers were counting something that is not a sequence —
                these three pillars work at the same time and reinforce each
                other, which the section's own lead says out loud ("שלושה מישורים
                שמזיזים אחד את השני"). Numbering them contradicted the copy.

                Icon and heading now share one flex row, so the card opens with a
                single object to read instead of a glyph, a number and a title
                stacked three deep.
              */}
              <div className="method__row">
                <span aria-hidden="true" className="method__icon">
                  <LineIcon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.description}</p>
            </Reveal>
          ))}
          </div>
        </div>
        <SectionCta cta={method.cta} />
      </Container>
    </section>
  );
}
