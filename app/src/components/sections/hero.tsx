import { Container, buttonStyles } from "@foundation/ui";

import { OneShotCta } from "@/components/motion/one-shot-cta";
import { stripTerminal } from "@/components/ui/section-heading";
import { WaveText } from "@/components/ui/wave-text";
import type { SiteContent } from "@/content";
import { siteUrl } from "@/lib/site-url";
import { LeadLink } from "@/components/lead/lead-link";

import { Showreel } from "./showreel";

/**
 * The hero, rebuilt as a CENTRED COLUMN on 2026-08-05.
 *
 * ⚠️ IT WAS A TWO-COLUMN GRID AND THAT WAS THE WRONG SHAPE. `hero__layout` ran
 * `grid-template-columns: 0.95fr 1.05fr`, which parked the clip in a side
 * column beside the heading. Daniel: *"the video is placed horribly. It's
 * placed on the left instead of the center, under the header and secondary
 * header."*
 *
 * He is describing the standard order for a video hero, and it is the right
 * one: the words have to land BEFORE the clip, because the clip is 60 seconds
 * long and nobody spends 60 seconds on something they have not been given a
 * reason to watch. So the reading order and the visual order are now the same
 * top-to-bottom sequence —
 *
 *     h1            the promise, one finished sentence per line
 *     subhead       the objections that stop her believing it
 *     video         centred, and only now that there is a reason to press play
 *     actions       the call, and the shortcut to the proof
 *     hint          what happens if she presses play
 *
 * — and there is no width at which the clip sits beside the type.
 *
 * The heading is an ARRAY of lines rather than one string, because where the
 * lines break is a copy decision. See `hero.titleLines` in the content file.
 */
export function Hero({ content }: { content: SiteContent }) {
  const { hero } = content;

  return (
    <section aria-labelledby="hero-title" className="hero">
      <Container className="hero__layout">
        <div className="hero__intro">
          {/*
            ONE crest of gold sweeps the whole heading, letter by letter and
            line by line in reading order. See `ui/section-heading.tsx`.
          */}
          <h1 className="hero__title" id="hero-title">
            <WaveText
              label={hero.titleLines.join(" ")}
              text={hero.titleLines.map(stripTerminal).join("\n")}
            />
          </h1>

          {/*
            A `<p>` of spans rather than several paragraphs: it is ONE sentence
            of argument broken into three beats, so it must be one block to a
            screen reader and three lines to an eye.
          */}
          <p className="hero__subhead">
            {hero.subheadLines.map((line) => (
              <span className="hero__subhead-line" key={line}>
                {line}
              </span>
            ))}
          </p>
        </div>

        <Showreel content={content} />

        <div className="hero__foot">
          <OneShotCta className="hero__actions">
            <LeadLink className={buttonStyles()}>{hero.primaryCta}</LeadLink>
            <a
              className={buttonStyles({ variant: "secondary" })}
              href={siteUrl("#proof")}
            >
              {hero.secondaryCta}
            </a>
          </OneShotCta>
          <p className="hero__hint">{hero.videoHint}</p>
        </div>
      </Container>
    </section>
  );
}
