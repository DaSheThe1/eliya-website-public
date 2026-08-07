"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

import type { ProofItem } from "@/content";
import { TileVideo } from "@/components/motion/tile-video";

/**
 * The proof gallery: a snapping, auto-advancing track with arrows and a
 * full-size viewer. Used twice on the page — once for the screenshots, once for
 * the clips.
 *
 * ⚠️ WHAT THIS REPLACED, AND WHY IT IS NOT THE SAME SHAPE AS BEFORE.
 * The section was a static wall of twelve square tiles that swapped their
 * contents on a timer. Daniel, 2026-08-05: *"There is still no gallery in the
 * social proof section like this gallery that is switching and then you can
 * press the right and left arrows to go between stuff. Could be a gallery where
 * it is like two rows because we have a lot of them so set a split into two. We
 * can have one for audio/video and one for regular images."*
 *
 * The wall's failure was concrete rather than stylistic: eleven phone
 * screenshots rendered four-across came out about 200px wide each, and every
 * one of them is a conversation whose whole value is the words inside it. At
 * 200px they were unreadable, so the section was showing evidence nobody could
 * actually read.
 *
 * ── WHY SCROLL-SNAP AND NOT A TRANSFORMED TRACK ──
 * Pnina's `GalleryCarousel` translates a flex track and mirrors clones onto
 * both ends for the loop. It looks good and it is entirely JavaScript: with
 * scripting off it collapses to one tile. This page has a no-JS obligation —
 * there is a Playwright spec asserting the proof tiles render with
 * `javaScriptEnabled: false` — so the mechanism here is a native scroll-snap
 * track instead. Without JavaScript it is already a working, swipeable,
 * keyboard-scrollable gallery showing every artefact. The arrows, the
 * auto-advance and the viewer are enhancements layered on top of that.
 *
 * ⚠️ `dir="ltr"` ON THE TRACK IS LOAD-BEARING. The document is RTL, where
 * `scrollLeft` runs negative in some engines and positive in others, and
 * `scrollBy({ left })` flips meaning with it. Pinning the track to LTR makes
 * the scroll maths single-valued; the tiles inside are set back to RTL so the
 * Hebrew captions read correctly, and the arrow buttons are labelled by
 * MEANING ("הבא" / "הקודם") rather than by direction.
 */

const ADVANCE_MS = 4200;

/**
 * Whether React has hydrated on the client.
 *
 * ⚠️ NOT `useEffect(() => setEnhanced(true), [])`. That form renders once with
 * the wrong answer and again with the right one, and this repo's lint rules
 * reject it outright (`react-hooks/set-state-in-effect`) for the cascading
 * render it causes. `useSyncExternalStore` with a `false` SERVER snapshot and a
 * `true` client snapshot expresses the same thing as what it actually is — a
 * value read from outside React — and `save-data.ts` uses the identical shape
 * for the same reason.
 */
const NEVER_CHANGES = () => () => undefined;
function useHydrated(): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
}

function MediaSlide({ item, expandLabel, onExpand, playLabel, pauseLabel }: {
  item: ProofItem;
  expandLabel: string;
  onExpand: () => void;
  playLabel: string;
  pauseLabel: string;
}) {
  const { media } = item;

  if (media.kind === "video") {
    return (
      <TileVideo
        label={item.alt}
        pauseLabel={pauseLabel}
        playLabel={playLabel}
        poster={media.poster}
        src={media.src}
      />
    );
  }

  if (media.kind === "audio") {
    return (
      <div className="gallery__media gallery__media--audio">
        <p className="gallery__audio-label">{item.alt}</p>
        <audio controls preload="none" src={media.src} />
      </div>
    );
  }

  if (media.kind === "quote") {
    return (
      <figure className="gallery__media gallery__media--quote">
        <blockquote>{media.text}</blockquote>
        <figcaption>{media.attribution}</figcaption>
      </figure>
    );
  }

  // A still. The whole tile is the control that opens it full size, because at
  // tile scale the message inside a screenshot cannot be read.
  return (
    <button
      aria-label={`${expandLabel}: ${item.alt}`}
      className="gallery__expand"
      onClick={onExpand}
      type="button"
    >
      <img
        alt={item.alt}
        className="gallery__media"
        height={1080}
        loading="lazy"
        src={media.src}
        width={1080}
      />
      <span aria-hidden className="gallery__expand-badge">
        <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M9 3H3v6M15 21h6v-6M3 15v6h6M21 9V3h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

export function Gallery({
  items,
  heading,
  previousLabel,
  nextLabel,
  expandLabel,
  playLabel,
  pauseLabel,
  onOpen,
}: {
  items: ProofItem[];
  heading: string;
  previousLabel: string;
  nextLabel: string;
  expandLabel: string;
  playLabel: string;
  pauseLabel: string;
  onOpen: (item: ProofItem) => void;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const { reduced } = useSiteMotionPreference();
  const [paused, setPaused] = useState(false);
  const headingId = useId();

  // Arrows and auto-advance only exist once JavaScript has run. Rendering them
  // in the server HTML would put two dead buttons on the page for anyone whose
  // scripts never arrive.
  const enhanced = useHydrated();

  /*
   * ⚠️ ARROWS ONLY EXIST IF THERE IS SOMEWHERE TO GO.
   *
   * The condition used to be `items.length > 1`, which is not the same question.
   * The media track holds two clips that both fit on screen at once, so it never
   * overflows — and it rendered two arrows anyway, pinned to the container edges
   * a few hundred pixels away from the two centred tiles, that scrolled a track
   * with nothing to scroll. Two dead controls on either side of the content.
   *
   * `scrollWidth > clientWidth` is the real question, and it has to be measured
   * rather than counted: whether eleven stills overflow depends on the viewport,
   * and a resize can change the answer either way. Hence the ResizeObserver,
   * which watches the track itself so a container query is not needed.
   */
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () =>
      setScrollable(track.scrollWidth > track.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length]);

  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const tile = track.querySelector<HTMLElement>(".gallery__tile");
    if (!tile) return;

    const stride = tile.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    const max = track.scrollWidth - track.clientWidth;
    const next = track.scrollLeft + direction * stride;

    // Wrap rather than dead-end. A gallery that stops at the last tile reads as
    // broken when the arrow stays lit and nothing happens.
    const target = next > max + 1 ? 0 : next < -1 ? max : next;
    track.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  // Auto-advance is subject to the same test: a track that cannot move should
  // not be told to move every few seconds.
  useEffect(() => {
    if (!enhanced || reduced || paused || !scrollable) return;
    const timer = window.setInterval(() => step(1), ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [enhanced, paused, reduced, scrollable, step]);

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="gallery"
      onBlurCapture={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="gallery__head">
        <h3 className="gallery__title" id={headingId}>
          {heading}
        </h3>
      </div>

      {/*
        ⚠️ THE ARROWS FLANK THE PICTURES, NOT THE HEADING.

        Measured 2026-08-06 at 2560px: both arrows sat at top 10916, and so did
        the `<h3>` — the same row, some 60px above the thing they scroll. Daniel:
        *"The arrows shouldn't be on the top where it's in the same horizontal
        line of the header of the gallery. It should be on the right and on the
        left of the gallery itself of the pictures in the middle."*

        They are now absolutely positioned against `.gallery__viewport` and
        centred on the track's own vertical midpoint, one on each physical edge.

        ⚠️ `--gallery-prev` / `--gallery-next` ARE PHYSICAL SIDES, NOT LOGICAL
        ONES. The document is RTL but the track is `dir="ltr"` (see the note
        below), so "previous" and "next" run in opposite directions for the two.
        `inset-inline` on either would resolve against whichever direction that
        subtree happens to be in and put both arrows on the same edge. The CSS
        pins them with `left` and `right` and this markup states which is which.
      */}
      <div className="gallery__viewport">
        {enhanced && scrollable ? (
          <button
            aria-label={previousLabel}
            className="gallery__arrow gallery__arrow--prev"
            onClick={() => step(-1)}
            type="button"
          >
            <svg aria-hidden fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}

      {/*
        ⚠️ dir="ltr" — see the note at the top of this file.

        ⚠️ tabIndex={0} IS NOT DECORATION. A scrollable region that cannot be
        focused is unreachable to anyone driving the page from a keyboard: the
        arrow keys only scroll the element the focus is inside, so without this
        the gallery could be scrolled by a mouse and by a thumb and by nothing
        else. axe flags it as `scrollable-region-focusable`, at serious impact,
        and it fired here at 390px before this was added. `aria-labelledby` is
        what names the resulting tab stop.

        ⚠️ DO NOT ADD `role="group"` TO SOLVE THAT NAMING. It was tried: it
        replaces the <ul>'s implicit `list` role, which orphans every <li>
        inside it, and axe then reports `listitem` at serious impact on all
        thirteen of them. A list can carry an accessible name and a tab stop
        without being relabelled as something else.
      */}
      <ul
        aria-labelledby={headingId}
        className="gallery__track"
        dir="ltr"
        ref={trackRef}
        tabIndex={0}
      >
        {items.map((item) => (
          <li
            className="gallery__tile proof__tile"
            data-kind={item.media.kind}
            dir="rtl"
            key={item.id}
          >
            <div className="gallery__card proof__card">
              <MediaSlide
                expandLabel={expandLabel}
                item={item}
                onExpand={() => onOpen(item)}
                pauseLabel={pauseLabel}
                playLabel={playLabel}
              />
            </div>
            <p className="gallery__caption">{item.caption}</p>
          </li>
        ))}
      </ul>

        {enhanced && scrollable ? (
          <button
            aria-label={nextLabel}
            className="gallery__arrow gallery__arrow--next"
            onClick={() => step(1)}
            type="button"
          >
            <svg aria-hidden fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}
