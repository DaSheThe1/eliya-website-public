"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

import type { LadderRung } from "@/content";

/**
 * The conversion beat, ported from the pattern on Pnina's page: a price ladder
 * that descends and lands on "free".
 *
 *     המחיר הרגיל לשיחת אבחון        ₪1,090  ✕
 *                    ↓
 *     המחיר לנשים שמגיעות דרך האתר     ₪419  ✕
 *                    ↓
 *              היום, בשבילך
 *               השיחה ללא עלות
 *                  [ button ]
 *
 * This is the one place on the page allowed to raise its voice, because what it
 * announces is a gift. That licence stops at the edge of this panel.
 *
 * WHY BOTH NUMBERS ARE STRUCK. Nothing is sold here. The page's whole job is a
 * name and a phone number; she sells on the call. So the ladder is not a
 * discount, it is a disclosure that neither price applies to what is being
 * offered.
 *
 * ⚠️ It may not become a discount: no red, no percentages, no countdown, no
 * "places remaining". Those are pressure mechanics and they are not what this
 * shape is for.
 *
 * HOW IT PLAYS. An IntersectionObserver driving a fixed CSS sequence, not a
 * scroll-linked timeline: the rungs land, the X stamps draw across the digits,
 * the arrows draw downward, the payoff arrives, the button blooms. It is a
 * composed sequence with its own timing, so gluing it to the scrollbar would
 * run it backwards when you scroll up.
 *
 * IT REPLAYS ON RE-ENTRY, and only on a full exit. Two thresholds rather than
 * one: parking a thumb exactly on a single boundary would otherwise restart the
 * sequence frame by frame, and on this panel a stutter reads as a throb.
 *
 * THE STATIC STATE IS THE DESIGN. The base CSS is the finished composition at
 * full volume. No JavaScript, no observer, motion opted out, or already on
 * screen at mount all land there. Nothing is ever hidden waiting for an
 * animation to reveal it, so an armed panel can never be what someone is left
 * looking at.
 */
const PLAY_RATIO = 0.35;
const SEQUENCE_MS = 3200;

export function FreeCallAnchor({
  rungs,
  freeLabel,
  children,
}: {
  rungs: LadderRung[];
  freeLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useSiteMotionPreference();
  const [state, setState] = useState<"static" | "armed" | "playing">("static");

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Already on screen at mount? Then someone is reading it, and hiding the
    // panel so it can fade back in is worse than no animation at all.
    const rect = node.getBoundingClientRect();
    const onScreenAtMount = rect.top < window.innerHeight && rect.bottom > 0;

    let current: "static" | "armed" | "playing" = onScreenAtMount
      ? "static"
      : "armed";
    setState(current);

    let settle: ReturnType<typeof setTimeout> | undefined;
    const go = (next: typeof current) => {
      if (next === current) return;
      current = next;
      setState(next);
      if (settle) {
        clearTimeout(settle);
        settle = undefined;
      }
      // Hand the panel back to its resting state once the entrance is over.
      if (next === "playing") {
        settle = setTimeout(() => {
          settle = undefined;
          if (current === "playing") {
            current = "static";
            setState("static");
          }
        }, SEQUENCE_MS);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio === 0) {
          go("armed");
          return;
        }
        // ⚠️ A PANEL TALLER THAN THE VIEWPORT CAN NEVER REACH PLAY_RATIO.
        // On a short viewport (a landscape phone, a split-screen window, or
        // any browser at 150% text scale) this panel is taller than the screen,
        // so its intersection ratio tops out below 0.35 and the sequence never
        // fires. An armed panel is transparent, so the visitor would be left
        // looking at an empty gold box where the offer should be. When the
        // panel cannot physically clear the ratio, its simply being on screen
        // is the trigger instead.
        const canReachRatio =
          entry.boundingClientRect.height <= window.innerHeight / PLAY_RATIO;
        const arrived = canReachRatio
          ? entry.intersectionRatio >= PLAY_RATIO
          : entry.isIntersecting;

        if (arrived && current === "armed") {
          go("playing");
        }
      },
      { threshold: [0, PLAY_RATIO] },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (settle) clearTimeout(settle);
    };
  }, [reduced]);

  return (
    <div
      className="free-anchor"
      data-anchor={state === "static" ? undefined : state}
      ref={ref}
    >
      <div className="free-anchor__ladder">
        {/* The metal, declared once for every arrow and every X below. A flat
            gold stroke is a gold line; one that runs pale to deep to pale along
            its length is a line made of metal. All of it is decorative and
            aria-hidden, so it carries no contrast obligation. */}
        <svg aria-hidden className="free-anchor__defs" focusable="false" height={0} width={0}>
          <defs>
            <linearGradient id="free-anchor-metal" x1="0" x2="1" y1="0" y2="1">
              {/* The metal ramp, tracking the palette: gold-bright specular,
                  gold-deep in the shadow, champagne on the return. Kept as
                  literals rather than `var()` because an SVG gradient stop
                  inside a `<defs>` that is `display:none`-adjacent resolves
                  custom properties inconsistently across engines. If the
                  palette in globals.css moves, move these three with it. */}
              <stop offset="0%" stopColor="#fae7b4" />
              <stop offset="45%" stopColor="#a97f32" />
              <stop offset="100%" stopColor="#f2e2c2" />
            </linearGradient>
          </defs>
        </svg>

        {rungs.map((rung, index) => (
          <div
            className="free-anchor__rung"
            key={rung.price}
            style={{ "--rung": index } as CSSProperties}
          >
            <p className="free-anchor__rung-label">{rung.label}</p>
            <p className="free-anchor__rung-price">
              <span className="free-anchor__rung-figure">
                <bdi className="free-anchor__figure-text">{rung.price}</bdi>
                {/* Two strokes corner to corner. preserveAspectRatio="none"
                    plus a non-scaling stroke lets the box stretch to whatever
                    the number measures while the line stays 2px. */}
                <svg
                  aria-hidden
                  className="free-anchor__x"
                  focusable="false"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <line
                    className="free-anchor__x-stroke"
                    pathLength={1}
                    vectorEffect="non-scaling-stroke"
                    x1="3"
                    x2="97"
                    y1="16"
                    y2="84"
                  />
                  <line
                    className="free-anchor__x-stroke free-anchor__x-stroke--second"
                    pathLength={1}
                    vectorEffect="non-scaling-stroke"
                    x1="97"
                    x2="4"
                    y1="14"
                    y2="86"
                  />
                </svg>
              </span>
            </p>

            {/* The operator between this rung and the next. Decorative: a
                screen reader reads label, price, label, price, payoff in order
                and loses nothing. */}
            <svg
              aria-hidden
              className="free-anchor__step-arrow"
              focusable="false"
              height={44}
              viewBox="0 0 24 44"
              width={24}
            >
              {/* Not perfectly vertical on purpose. A linearGradient defaults
                  to objectBoundingBox units, a vertical line has a zero-width
                  box, and a gradient over a zero-area box is undefined, so the
                  line simply does not render. Leaning it 0.8 units over 32
                  gives the box real width. That is a 1.4 degree tilt on a 2px
                  stroke, invisible, and it keeps the metal. The path is 32
                  units long and the CSS dash uses that number: change one,
                  change the other. */}
              <path className="free-anchor__step-line" d="M 11.6 2 L 12.4 34" />
              <path
                className="free-anchor__step-head"
                d="M 4.5 26 L 12 35.5 L 19.5 26"
              />
            </svg>
          </div>
        ))}

        {/*
          ⚠️ `freeNote` IS GONE, AND THIS LINE TOOK ITS PLACE AT FULL SIZE.
          The ladder used to land on a small label and then a large two-line
          slab reading "השיחה / ללא עלות". Daniel, 2026-08-07: *"remove the part
          where you say 'השיחה ללא עלות'. It is useless and I really don't want
          it to be there because in the call to action you say the same thing
          anyway. There is no reason to put it under the text. My text that I
          gave you should be the main one."*

          He is right that it was said twice: the button immediately below reads
          "לשיחה איתי, ללא עלות". The ladder's payoff is now his sentence, set at
          the size the slab used to have — so the argument still lands on
          something large, and it lands on the REASON rather than on a repeat of
          the button.
        */}
        <p className="free-anchor__free">{freeLabel}</p>
      </div>

      <div className="free-anchor__cta">{children}</div>
    </div>
  );
}
