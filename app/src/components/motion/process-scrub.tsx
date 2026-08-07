"use client";

import { useEffect, useMemo, useRef } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

import type { ProcessStep } from "@/content";
import { useAllowsMediaBytes } from "@/lib/save-data";

/**
 * The scroll-driven process journey, ported from `process-scrub.tsx` on
 * Pnina's site at Daniel's instruction. What was kept, what was changed, and
 * what was deliberately left out:
 *
 * ── KEPT, BECAUSE IT IS THE WHOLE POINT ──
 * Native document scroll is the only navigation mechanism. This component never
 * calls preventDefault, never locks the body, never installs scroll-snap on the
 * root and never queues a destination. Every listener is passive. A page that
 * fights the scrollbar is the single most common way an effect like this makes
 * a site worse, and Pnina's implementation is careful about it in a way that is
 * worth copying exactly.
 *
 * The story is also independent of the media: the four stations are in the
 * server HTML in reading order, the stage carries a poster until a real video
 * frame has painted, and a failed or slow clip changes neither the copy nor the
 * section's geometry.
 *
 * The seek is coalesced through one rAF and one `desiredProgress` ref rather
 * than being driven per scroll event — Safari owns a small decoder buffer and
 * firing a seek per event stalls it.
 *
 * ── CHANGED FOR THIS REPO ──
 * Pnina's version is Tailwind + next-intl + its own `cn`; none of those exist
 * here, so the classes are plain CSS in globals.css and the copy arrives as a
 * prop from `content.process`. Her motion switch is `usePrefersReducedMotion`
 * reading the OS; this site's is the stored `data-site-motion` choice through
 * `useSiteMotionPreference`, which is the accessibility panel's toggle.
 *
 * ── LEFT OUT ON PURPOSE ──
 * Her phone "settle" behaviour, which nudges the page to the nearest station
 * after a touch gesture has completely finished. It is about 120 lines, it is
 * the most delicate part of that file, and it is the part most likely to feel
 * wrong on a page whose sections are laid out differently. Scrolling here is
 * simply scrolling. If Daniel wants the settle, it is a deliberate follow-up
 * and not something to smuggle in.
 */

const STATIONS = 4;
const MOBILE_QUERY = "(max-width: 40rem)";
/** Start fetching when the journey is within three viewports. */
const LOAD_MARGIN = "300% 0px";
const SEEK_EPSILON_SECONDS = 0.055;
/** Each station gets a long readable rest; the copy moves in the middle third. */
const COPY_HOLD_START = 0.34;
const COPY_HOLD_END = 0.66;

const MEDIA = {
  mobile: {
    src: "/motion/process/placeholder-mobile.mp4",
    poster: "/motion/process/placeholder-mobile-poster.webp",
  },
  desktop: {
    src: "/motion/process/placeholder-desktop.mp4",
    poster: "/motion/process/placeholder-desktop-poster.webp",
  },
} as const;

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/**
 * Where the copy rail sits for a given scroll position. A POSITION mapping, not
 * a clock: a dropped frame can only ever land on a later correct state, never
 * on a stale one.
 */
const copyPositionAt = (position: number) => {
  const from = Math.min(STATIONS - 1, Math.max(0, Math.floor(position)));
  if (from === STATIONS - 1) return from;
  const local = position - from;
  const travel = clamp(
    (local - COPY_HOLD_START) / (COPY_HOLD_END - COPY_HOLD_START),
  );
  // smoothstep
  return from + travel * travel * (3 - 2 * travel);
};

/** Splits a line on `*…*` and sets what was inside apart. */
function HighlightedLine({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*([^*]+)\*/g).map((part, index) =>
        // Odd indices are the captured groups, i.e. what was between markers.
        index % 2 === 1 ? (
          <strong className="scrub-copy__mark" key={`${part}-${index}`}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function ProcessScrub({
  steps,
  title,
  endpoint,
  progressLabel,
  placeholderNote,
}: {
  steps: ProcessStep[];
  title: string;
  endpoint: string;
  /** Template carrying `{current}` and `{total}`. See the content type. */
  progressLabel: string;
  placeholderNote: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyRailRef = useRef<HTMLDivElement>(null);
  const whereRef = useRef<HTMLSpanElement>(null);
  const desiredProgressRef = useRef(0);
  const seekRef = useRef<(progress: number) => void>(() => undefined);

  const { reduced } = useSiteMotionPreference();
  const allowsBytes = useAllowsMediaBytes();
  const enabled = !reduced;

  const stationLabels = useMemo(
    () =>
      Array.from({ length: STATIONS }, (_, index) =>
        progressLabel
          .replace("{current}", String(index + 1))
          .replace("{total}", String(STATIONS)),
      ),
    [progressLabel],
  );

  /*
   * Media lifecycle. The URL lives in this effect rather than in the <video>
   * markup, so a visitor on Save-Data or with motion switched off performs
   * ZERO video requests — not a cancelled one, none at all.
   */
  useEffect(() => {
    const track = trackRef.current;
    const video = videoRef.current as VideoWithFrameCallback | null;
    if (!enabled || !allowsBytes || !track || !video) return;

    let disposed = false;
    let started = false;
    let sourceKey = "";
    let metadataReady = false;
    let frameReady = false;
    let seeking = false;

    const selected = () =>
      window.matchMedia(MOBILE_QUERY).matches ? MEDIA.mobile : MEDIA.desktop;

    const markPainted = () => {
      if (disposed || frameReady) return;
      const finish = () => {
        if (disposed) return;
        frameReady = true;
        track.dataset.processMediaReady = "true";
      };
      // ⚠️ The poster stays up until a REQUESTED FRAME HAS PAINTED, not until
      // `loadeddata`. Swapping on readyState alone shows one blank frame on
      // Safari, which reads as a flash of black behind the copy.
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(finish);
      else window.requestAnimationFrame(() => window.requestAnimationFrame(finish));
    };

    const requestSeek = () => {
      if (
        disposed ||
        !metadataReady ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      ) {
        return;
      }

      const playableEnd = Math.max(0, video.duration - 0.04);
      const wanted = desiredProgressRef.current * playableEnd;
      if (seeking) return;
      if (Math.abs(video.currentTime - wanted) < SEEK_EPSILON_SECONDS) {
        markPainted();
        return;
      }

      seeking = true;
      try {
        video.currentTime = wanted;
      } catch {
        seeking = false;
      }
    };

    seekRef.current = (progress) => {
      desiredProgressRef.current = clamp(progress);
      requestSeek();
    };

    const onLoadedMetadata = () => {
      metadataReady = true;
      requestSeek();
    };
    const onLoadedData = () => {
      metadataReady = true;
      requestSeek();
      if (!video.seeking) markPainted();
    };
    const onSeeked = () => {
      seeking = false;
      markPainted();
      // A seek that finished against a stale target: chase the current one.
      const playableEnd = Math.max(0, video.duration - 0.04);
      const latest = desiredProgressRef.current * playableEnd;
      if (Math.abs(video.currentTime - latest) >= SEEK_EPSILON_SECONDS) {
        requestSeek();
      }
    };
    const onError = () => {
      seeking = false;
      metadataReady = false;
      frameReady = false;
      delete track.dataset.processMediaReady;
      // The poster simply stays. Nothing about the copy or the geometry moves.
      track.dataset.processMediaFailed = "true";
    };

    const loadSource = () => {
      if (!started || disposed) return;
      const choice = selected();
      if (sourceKey === choice.src) return;
      sourceKey = choice.src;
      metadataReady = false;
      frameReady = false;
      seeking = false;
      delete track.dataset.processMediaReady;
      delete track.dataset.processMediaFailed;
      video.pause();
      video.src = choice.src;
      video.load();
    };

    const start = () => {
      if (started || disposed) return;
      started = true;
      loadSource();
    };

    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              start();
              observer?.disconnect();
            },
            { rootMargin: LOAD_MARGIN },
          )
        : null;

    const query = window.matchMedia(MOBILE_QUERY);
    const onCut = () => loadSource();
    /*
     * iOS will not decode a frame for a video that has never been played, even
     * to satisfy a seek. One muted play/pause inside the first real gesture
     * unlocks the decoder; after that every seek paints.
     */
    const onFirstGesture = () => {
      start();
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      const attempt = video.play();
      if (attempt) attempt.then(() => video.pause()).catch(() => undefined);
      else video.pause();
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    query.addEventListener("change", onCut);
    window.addEventListener("touchstart", onFirstGesture, { once: true, passive: true });
    window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });

    if (observer) observer.observe(track);
    else start();

    return () => {
      disposed = true;
      observer?.disconnect();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      query.removeEventListener("change", onCut);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("pointerdown", onFirstGesture);
      seekRef.current = () => undefined;
      video.pause();
      video.removeAttribute("src");
      video.load();
      delete track.dataset.processMediaReady;
      delete track.dataset.processMediaFailed;
    };
  }, [allowsBytes, enabled]);

  /*
   * Scroll lifecycle. One rAF loop reads geometry and writes a transform plus a
   * coalesced seek. No scroll listener does layout work.
   */
  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const rail = copyRailRef.current;
    if (!enabled || !track || !stage || !rail) return;

    let disposed = false;
    let frame = 0;
    let last = -1;
    track.dataset.processController = "ready";

    const render = () => {
      if (disposed) return;

      const rect = track.getBoundingClientRect();
      const stageHeight = Math.max(1, stage.getBoundingClientRect().height);
      const travel = Math.max(1, rect.height - stageHeight);
      const progress = clamp(-rect.top / travel);
      const position = progress * (STATIONS - 1);
      desiredProgressRef.current = progress;

      if (Math.abs(progress - last) > 0.0001) {
        const active = Math.min(STATIONS - 1, Math.max(0, Math.round(position)));
        const copyPosition = copyPositionAt(position);
        rail.style.transform = `translate3d(${(-copyPosition * 100) / STATIONS}%,0,0)`;
        track.dataset.processActiveStep = String(active + 1);
        if (whereRef.current) whereRef.current.textContent = stationLabels[active];
        seekRef.current(progress);
        last = progress;
      }

      track.dataset.processPinned = String(
        rect.top <= 1 && rect.bottom >= stageHeight - 1,
      );
      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      rail.style.transform = "translate3d(0,0,0)";
      delete track.dataset.processActiveStep;
      delete track.dataset.processPinned;
      delete track.dataset.processController;
    };
  }, [enabled, stationLabels]);

  return (
    <div
      className="process-scrub"
      data-process-active-step="1"
      data-process-track=""
      ref={trackRef}
    >
      <h2 className="a11y-visually-hidden">{title}</h2>

      {/*
        The complete story in reading order, independent of the media and of
        the transform above. Markers are stripped: a screen reader must never
        announce the asterisks.
      */}
      <ol className="a11y-visually-hidden">
        {steps.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            {step.lines.map((line) => (
              <p key={line}>{line.replace(/\*/g, "")}</p>
            ))}
          </li>
        ))}
      </ol>

      <div className="process-scrub__stage" ref={stageRef}>
        <div aria-hidden className="process-scrub__poster" />

        <video
          aria-hidden
          className="process-scrub__video"
          disablePictureInPicture
          muted
          playsInline
          preload="none"
          ref={videoRef}
        />

        {/*
          ⚠️ dir="ltr" on the rail and its clip, dir="rtl" on each slide. The
          rail is moved with a negative translate along the writing axis; in an
          RTL container that axis is mirrored and every slide lands off-screen.
          The Hebrew inside each slide still has to read right-to-left, hence
          the reversal one level down. Same trick, same reason, as the gallery.
        */}
        <div aria-hidden="true" className="scrub-copy" dir="ltr">
          <div className="scrub-copy__rail" dir="ltr" ref={copyRailRef}>
            {steps.map((step, index) => (
              <div className="scrub-copy__slide" dir="rtl" key={step.title}>
                <span className="scrub-copy__title">{step.title}</span>
                {step.lines.map((line, lineIndex) => (
                  <p
                    className={
                      lineIndex === 0
                        ? "scrub-copy__line scrub-copy__line--loud"
                        : "scrub-copy__line"
                    }
                    key={line}
                  >
                    <HighlightedLine text={line} />
                  </p>
                ))}
                {index === STATIONS - 1 ? (
                  <p className="scrub-copy__endpoint">{endpoint}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="scrub-pill">
          <span ref={whereRef}>{stationLabels[0]}</span>
          <span aria-hidden className="scrub-pill__arrow">
            ▼
          </span>
        </div>

        {/* ⚠️ Placeholder footage. Says so on the page; see the content note. */}
        <p className="process-scrub__placeholder">{placeholderNote}</p>
      </div>
    </div>
  );
}
