import { Container } from "@foundation/ui";

import { NativeScrollStory } from "@/components/motion/native-scroll-story";
import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading, headlineText } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";

/**
 * The four headline numbers, told through the scroll story: each figure gets a
 * warm lift as it arrives and keeps it. See the note in native-scroll-story.tsx
 * for why nothing here dims.
 */
export function Stats({ content }: { content: SiteContent }) {
  const { stats } = content;

  return (
    <section aria-labelledby="stats-title" className="section stats">
      <Container>
        <SectionHeading
          id="stats-title"
          lead={stats.description}
          lines={stats.titleLines}
        />
        <NativeScrollStory
          label={headlineText(stats.titleLines)}
          stations={stats.items.map((item) => ({
            id: item.id,
            content: (
              <div className="stat">
                <span className="stat__value">{item.value}</span>
                <p className="stat__label">{item.label}</p>
              </div>
            ),
          }))}
        />
        <SectionCta cta={stats.cta} />
      </Container>
    </section>
  );
}
