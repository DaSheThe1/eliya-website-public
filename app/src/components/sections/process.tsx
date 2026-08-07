"use client";

import { useSiteMotionPreference } from "@foundation/accessibility";
import { Container } from "@foundation/ui";

import { ProcessScrub } from "@/components/motion/process-scrub";
import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading, headlineText } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";

/**
 * The process journey, and its complete static twin.
 *
 * ⚠️ BOTH RENDERINGS ARE ALWAYS IN THE MARKUP and CSS shows exactly one, keyed
 * off `data-process-mode`. This is Pnina's `process-experience.tsx` pattern and
 * the reason for it is worth restating: the animated shell is in the server
 * HTML at its FINAL height. It is never swapped in after a measurement or a
 * network probe, so a cold phone load cannot reflow every section below it
 * while the visitor is already scrolling.
 *
 * The static branch is not a degraded fallback — it is the same four steps as
 * ordinary cards, and it is what a visitor gets with the motion switch off,
 * with Save-Data on, or with no JavaScript at all. Under `<noscript>` the CSS
 * below hides the motion branch outright.
 *
 * This runs under the already-enabled `motion-native-scroll-story` module, so
 * it needs no change to the brief or the generated module set.
 */
export function Process({ content }: { content: SiteContent }) {
  const { process } = content;
  const { reduced } = useSiteMotionPreference();

  return (
    <section
      aria-labelledby="process-title"
      className="section process"
      id="process"
    >
      <Container>
        <SectionHeading id="process-title" lines={process.titleLines} />
      </Container>

      <div
        className="process-experience"
        data-process-mode={reduced ? "static" : "motion"}
      >
        <noscript>
          <style>{`.process-experience__motion{display:none}.process-experience__static{display:block}`}</style>
        </noscript>

        <div className="process-experience__motion">
          <ProcessScrub
            endpoint={process.endpoint}
            placeholderNote={process.mediaPlaceholderNote}
            progressLabel={process.progressLabel}
            steps={process.steps}
            title={headlineText(process.titleLines)}
          />
        </div>

        <div className="process-experience__static">
          <Container>
            <ol className="process-static">
              {process.steps.map((step, index) => (
                <li className="process-static__step card" key={step.title}>
                  <span aria-hidden className="process-static__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{step.title}</h3>
                  {step.lines.map((line) => (
                    <p key={line}>{line.replace(/\*/g, "")}</p>
                  ))}
                </li>
              ))}
            </ol>
          </Container>
        </div>
      </div>

      <Container>
        <SectionCta cta={process.cta} />
      </Container>
    </section>
  );
}
