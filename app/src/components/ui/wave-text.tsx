"use client";

import { useEffect, useRef } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

/**
 * The letter gloss, ported from `ui/wave-text.tsx` on automations-website at
 * Daniel's instruction, 2026-08-06: *"I want to have the letter gloss that I
 * have in my repo, which is the automations-website, where the letters are like
 * low one after the other."*
 *
 * ONE crest — about two words wide — sweeps across the phrase from the first
 * letter to the last, tinting each letter as it passes, then rests before it
 * repeats. Letters rest at the readable ink colour, so the line stays legible
 * at every moment of the cycle.
 *
 * ── WHAT CHANGED IN THE PORT, AND WHY ──
 *
 *  1. THE CREST IS GOLD, NOT BLUE. The source sweeps azure (205deg) to indigo
 *     (232deg) because that is the automations palette. Here the crest runs
 *     gold (41deg) to champagne (44deg): it has to be the accent hue this site
 *     already owns, or the headline lights up in a colour that appears nowhere
 *     else on the page.
 *
 *  2. IT ONLY RUNS WHILE IT IS ON SCREEN. The source animates one headline, so
 *     one rAF loop for the life of the page is free. This site puts the gloss on
 *     the h1 AND on nine section headings, and nine always-on rAF loops on a
 *     phone is a real cost for something nobody is looking at. An
 *     IntersectionObserver starts the clock on entry and cancels it on exit,
 *     resetting the letters to rest — so at most one or two loops are live at
 *     any scroll position, which is the same cost as the original.
 *
 *  3. MOTION POLICY COMES FROM `useSiteMotionPreference`, this site's stored
 *     switch, rather than the source's accessibility provider. Same contract:
 *     the in-site Reduce motion control is the kill switch, and when it is on
 *     the letters simply keep their resting colour.
 *
 * ── WHAT DID NOT CHANGE, AND MUST NOT ──
 *
 * The crest is COLOUR-ONLY. No transform, no text-shadow, no blur. The source
 * carries a long comment about why: earlier versions lifted each letter and
 * wrote a blurred shadow, and re-rasterising that blur every frame made letters
 * visibly jump on high-DPR phones. Recolouring a fixed letter repaints cheaply.
 *
 * ONE shared clock drives every letter. Per-letter CSS animations with staggered
 * delays only show a single crest while all those clocks stay in phase; on some
 * loads they drift and the wave splits into two crests. A single rAF makes one
 * crest structural.
 *
 * Letters are grouped into words (`white-space: nowrap`) so the phrase wraps at
 * spaces and never mid-word. Per-character splitting is safe for Hebrew: no
 * contextual shaping, and final forms are distinct codepoints. The full string
 * is exposed to assistive tech through a visually hidden copy; the per-letter
 * spans are hidden from it — which also means a heading wrapped in this is still
 * a valid `aria-labelledby` target, because its accessible name still comes from
 * its own text content.
 */
export function WaveText({
  text,
  label,
  className,
  cycle = 6,
  sweep = 0.84,
}: {
  text: string;
  /**
   * What assistive tech reads, when it differs from what is drawn.
   *
   * ⚠️ THIS EXISTS BECAUSE OF PUNCTUATION. Headings drop their trailing full
   * stop for display — a line that is already the end of a line does not need a
   * mark saying so — but a screen reader USES that full stop: it is what makes
   * it pause between two sentences instead of running them together into one
   * breath. Stripping it from the visible letters is a typographic decision;
   * stripping it from the spoken string is a regression.
   *
   * Defaults to `text`, so a caller with nothing to hide passes nothing.
   */
  label?: string;
  className?: string;
  /** Total seconds for one full loop (sweep + rest). */
  cycle?: number;
  /** Fraction of the cycle the crest spends travelling first to last letter. */
  sweep?: number;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const { reduced } = useSiteMotionPreference();

  const tokens = text.split(/(\n|[^\S\n]+)/);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const chars = Array.from(
      root.querySelectorAll<HTMLElement>(".wave-text__char"),
    );
    const count = chars.length;
    if (count === 0) return;

    const rest = () =>
      chars.forEach((character) => character.style.removeProperty("color"));

    if (reduced) {
      rest();
      return;
    }

    /*
     * ⚠️ THE RESTING COLOUR IS READ FROM CSS, NOT HARD-CODED.
     *
     * The source pins it to its own `--foreground`. Reading the computed colour
     * off a real letter keeps the palette as the single source of truth:
     * change `--color-ink` in one place and the crest still returns to the
     * right value, and a heading that is deliberately set in another colour
     * returns to THAT rather than being dragged to a hard-coded white.
     */
    const restRgb = parseRgb(getComputedStyle(chars[0]).color) ?? [237, 241, 247];
    const crest = chars.map((_, index) => {
      const t = count > 1 ? index / (count - 1) : 0;
      // Gold (41deg) to champagne (44deg), lifting in lightness across the
      // sweep so the tail reads brighter than the head.
      return hslToRgb(41 + t * 3, 0.72, 0.66 + t * 0.08);
    });

    const sweepDuration = cycle * sweep;
    const sigma = 1.15; // crest half-width, in letters
    const previous = new Array<number>(count).fill(-1);
    let raf = 0;
    let start = 0;

    const frame = (now: number) => {
      if (!start) start = now;
      const phase = ((now - start) / 1000) % cycle;
      // The crest head sweeps from just before the first letter to just past
      // the last during the sweep window, and is parked at infinity while
      // resting — so there is always exactly one crest, or none.
      const head =
        phase <= sweepDuration
          ? -2 + (phase / sweepDuration) * (count - 1 + 4)
          : Number.POSITIVE_INFINITY;

      for (let index = 0; index < count; index += 1) {
        const distance = index - head;
        const intensity = Number.isFinite(distance)
          ? Math.exp(-(distance * distance) / (2 * sigma * sigma))
          : 0;
        // Skip DOM writes for letters that have not visibly changed.
        if (Math.abs(intensity - previous[index]) < 0.012) continue;
        previous[index] = intensity;

        const [cr, cg, cb] = crest[index];
        const r = Math.round(restRgb[0] + (cr - restRgb[0]) * intensity);
        const g = Math.round(restRgb[1] + (cg - restRgb[1]) * intensity);
        const b = Math.round(restRgb[2] + (cb - restRgb[2]) * intensity);
        chars[index].style.color = `rgb(${r}, ${g}, ${b})`;
      }

      raf = window.requestAnimationFrame(frame);
    };

    // See note 2 above: the clock only runs while the phrase is on screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!raf) {
            start = 0;
            previous.fill(-1);
            raf = window.requestAnimationFrame(frame);
          }
          return;
        }
        if (raf) {
          window.cancelAnimationFrame(raf);
          raf = 0;
          rest();
        }
      },
      { rootMargin: "10% 0px" },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
      rest();
    };
  }, [text, cycle, sweep, reduced]);

  return (
    <span className={className ? `wave-text ${className}` : "wave-text"} ref={rootRef}>
      <span className="wave-text__label">{label ?? text}</span>
      <span aria-hidden>
        {tokens.map((token, tokenIndex) => {
          if (token === "") return null;
          if (token === "\n") return <br key={tokenIndex} />;
          if (/^\s+$/.test(token)) return <span key={tokenIndex}> </span>;
          return (
            <span className="wave-text__word" key={tokenIndex}>
              {splitCrestUnits(token).map((character, characterIndex) => (
                <span className="wave-text__char" key={characterIndex}>
                  {character}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    </span>
  );
}

/**
 * Split a word into the units the crest lights one at a time: single
 * characters, except that a run of Latin letters or digits stays whole.
 *
 * Each unit is an `inline-block`, and an inline-block is its own bidi isolate,
 * so one span per character would render "AI" as "IA" and "10" as "01" inside a
 * Hebrew line — those are left-to-right runs the browser can no longer reorder
 * once each character is boxed separately. Keeping the run in one span
 * preserves it, and the crest tints it at once, which is what you want anyway:
 * a number reads as a number, not as loose digits.
 */
function splitCrestUnits(token: string): string[] {
  return token.match(/[0-9A-Za-z]+|[\s\S]/gu) ?? [];
}

/** `rgb(r, g, b)` or `rgb(r g b / a)` to a triple; null if it cannot be read. */
function parseRgb(value: string): [number, number, number] | null {
  const parts = value.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return null;
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

/** HSL (h in degrees, s and l in 0..1) to [r, g, b] in 0..255. */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}
