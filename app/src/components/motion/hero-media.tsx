"use client";

import { useEffect, useRef, useState } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

import { useAllowsMediaBytes } from "@/lib/save-data";

interface HeroMediaProps {
  /** The line inside the frame, above the clip. See the note at the render. */
  caption: string;
  src: string;
  poster: string;
  label: string;
  playWithSoundLabel: string;
  playLabel: string;
  pauseLabel: string;
  fullscreenLabel: string;
}

// iOS Safari has no Element.requestFullscreen; the clip expands through the
// native player via this vendor method instead.
type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

function PlayGlyph() {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 24">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 24">
      <path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor" />
    </svg>
  );
}

/**
 * The hero player, ported from `sections/hero-video.tsx` on Pnina's site
 * rather than reinvented. The parts that matter, and why each is there:
 *
 * ── A 16:9 FRAME AROUND A 9:16 CLIP, LETTERBOXED, NOT CROPPED ──
 * `object-cover` on a portrait source in a landscape box throws away about 68%
 * of the frame vertically, which here means the top of her head and the burned
 * in Hebrew captions along the bottom. The captions are the only thing a
 * visitor can read while the clip is still silent, so the clip is
 * `object-contain` and the empty sides are filled by a SECOND copy of the same
 * element, blurred and darkened behind it. Same source and same attributes, so
 * the browser serves both from one buffer rather than fetching twice. It is
 * `aria-hidden`, has no controls and no pointer events, so the real element is
 * still the only thing anyone can reach.
 * When she supplies a real 16:9 master: delete the backdrop video and change
 * `object-fit` to cover. Nothing else here changes.
 *
 * ── THE WHOLE FRAME IS THE PLAY/PAUSE CONTROL ──
 * A real <button> over the clip, not a click handler on the <video>: a bare
 * handler is invisible to a keyboard and to a screen reader. It is mounted only
 * once she has started with sound, because before that the unmute sheet owns
 * the same rectangle and the first tap has a different job.
 *
 * ── A CENTRED DISC WHEN PAUSED ──
 * Without it a paused clip is indistinguishable from a broken one: the whole
 * frame is the tap target, so nothing on screen says the video is merely
 * paused. It is `pointer-events: none` because the button is the whole frame;
 * a hit target inside a hit target only creates a dead ring where they
 * disagree.
 *
 * ── THE PROGRESS LINE FILLS LEFT TO RIGHT ──
 * `dir="ltr"` and a left transform origin, explicitly. The document is RTL, so
 * without them the bar drains from the wrong end. It is an indicator and not a
 * scrubber: no drag, no hit target, `pointer-events: none`, because the entire
 * frame is one big play/pause button and a draggable strip along its bottom
 * edge would steal taps meant for it. Seeking lives in fullscreen.
 * It renders only once started; during the silent looping preview it would be
 * a sawtooth resetting every loop, which reads as a glitch.
 *
 * ── FULLSCREEN SITS TOP-END, WHICH IS LOAD-BEARING ──
 * Fullscreen belongs in a bottom corner in every player ever made and cannot go
 * in one here: this site has two viewport-fixed floating buttons and both of
 * this frame's bottom corners pass underneath one as it scrolls. The top edge
 * is the one place a bottom-pinned button can never reach.
 */
export function HeroMedia({
  caption,
  src,
  poster,
  label,
  playWithSoundLabel,
  playLabel,
  pauseLabel,
  fullscreenLabel,
}: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { reduced } = useSiteMotionPreference();
  /*
   * ⚠️ SAVE-DATA IS AN INDEPENDENT BYTE GATE, and honouring it costs the
   * pre-hydration autoplay that Pnina's player gets from having its <source> in
   * the server HTML.
   *
   * That trade is deliberate. "Zero video requests under Save-Data" is only a
   * real guarantee if the source is absent from the HTML the server sends: any
   * markup-level source is fetched by the preload scanner before a client check
   * could ever run. The hook's server snapshot is false for exactly that
   * reason, and everyone whose connection is not asking us to hold off gets the
   * source on hydration, a moment later.
   */
  const allowBytes = useAllowsMediaBytes();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const userPausedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const markReady = () => setReady(true);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();
    video.addEventListener("loadeddata", markReady);

    const onTime = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      setProgress(video.currentTime / video.duration);
    };
    video.addEventListener("timeupdate", onTime);

    return () => {
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("timeupdate", onTime);
    };
  }, []);

  // The stored motion switch can veto the autoplay attribute; a visitor who
  // paused is never restarted behind her back.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduced) {
      video.pause();
      return;
    }
    if (userPausedRef.current || !allowBytes) return;
    void video.play().catch(() => undefined);
  }, [allowBytes, reduced]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      void video.play().catch(() => undefined);
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  }

  function playWithSound() {
    const video = videoRef.current;
    if (!video) return;
    // Pressing play under Save-Data is explicit consent to fetch, so the
    // source is attached imperatively here without changing the gate itself.
    if (!allowBytes && !video.src) video.src = src;
    video.muted = false;
    video.loop = false;
    userPausedRef.current = false;
    /*
     * ⚠️ REWIND. THIS IS THE WHOLE POINT OF THE FIRST PRESS.
     *
     * Daniel, 2026-08-06: *"playing the video for the first time, hitting play
     * should restart it, like start from 0:00."*
     *
     * Before this line the clip was already running: it autoplays muted and
     * loops as a silent preview from the moment it loads. So whoever pressed
     * "play with sound" got sound from wherever the muted loop happened to have
     * reached — twenty seconds in, or four seconds from the end of a sixty
     * second clip, depending only on how long they had spent reading the
     * headline. The one thing pressing play must guarantee is that you hear the
     * beginning.
     *
     * It is set BEFORE `play()` rather than after: assigning `currentTime`
     * during playback on iOS Safari can be dropped while a seek is already in
     * flight, and seeking a paused-or-just-unmuted element is the reliable
     * order.
     */
    video.currentTime = 0;
    setProgress(0);
    setStarted(true);
    void video.play().catch(() => undefined);
  }

  function expand() {
    const video = videoRef.current as FullscreenVideo | null;
    if (!video) return;
    if (video.requestFullscreen) {
      void video.requestFullscreen().catch(() => undefined);
    } else {
      video.webkitEnterFullscreen?.();
    }
  }

  return (
    <div className="hero-video">
      <div aria-hidden className="hero-video__halo" />
      <div className="hero-video__mount">
        {/*
          ⚠️ INSIDE THE MOUNT, ABOVE THE STAGE — not above the whole player.
          Daniel, 2026-08-07: *"above the video in the same rectangle as the
          video."* Pnina does exactly this: the caption band sits within the
          bezel and the `aspect-video` box begins under it, so the line reads as
          part of the player rather than as a paragraph that happens to precede
          it. Putting it outside the mount would lose the entire point.
        */}
        <p className="hero-video__caption">{caption}</p>
        <div className="hero-video__stage">
          {/* The letterbox fill. Never paused, never given sound, no ref:
              wiring it to the same controls would mean two elements racing for
              the same play promise, and at this blur nobody can tell if it
              drifts a frame. */}
          <video
            aria-hidden
            autoPlay
            className="hero-video__backdrop"
            loop
            muted
            playsInline
            preload={allowBytes ? "auto" : "none"}
            tabIndex={-1}
          >
            {allowBytes ? <source src={src} type="video/mp4" /> : null}
          </video>

          <video
            aria-label={label}
            autoPlay
            className="hero-video__clip"
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            loop
            muted
            onContextMenu={(event) => event.preventDefault()}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            playsInline
            poster={poster}
            preload={allowBytes ? "auto" : "none"}
            ref={videoRef}
          >
            {allowBytes ? <source src={src} type="video/mp4" /> : null}
          </video>

          {/* Tap anywhere = play/pause, once sound has been taken. */}
          {started ? (
            <button
              aria-label={playing ? pauseLabel : playLabel}
              className="hero-video__tap"
              onClick={togglePlay}
              type="button"
            >
              {!playing ? (
                <span className="hero-video__disc" aria-hidden>
                  <PlayGlyph />
                </span>
              ) : null}
            </button>
          ) : null}

          {/* The unmute sheet owns the frame until she takes sound. */}
          {!started ? (
            <button
              aria-label={playWithSoundLabel}
              className="hero-video__unmute"
              onClick={playWithSound}
              type="button"
            >
              <span aria-hidden className="hero-video__disc">
                <PlayGlyph />
              </span>
              <span className="hero-video__unmute-label">
                {playWithSoundLabel}
              </span>
            </button>
          ) : null}

          <div className="hero-video__corner">
            {/* WCAG 2.2.2: a clip that starts on its own and runs longer than
                five seconds needs a way to stop it. Once started, the whole
                frame is that control, so this twin only exists before then. */}
            {!started ? (
              <button
                aria-label={playing ? pauseLabel : playLabel}
                className="hero-video__icon-button"
                onClick={togglePlay}
                type="button"
              >
                {playing ? <PauseGlyph /> : <PlayGlyph />}
              </button>
            ) : null}
            <button
              aria-label={fullscreenLabel}
              className="hero-video__icon-button"
              onClick={expand}
              type="button"
            >
              <svg aria-hidden focusable="false" viewBox="0 0 24 24">
                <path
                  d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>

          {started ? (
            <div aria-hidden className="hero-video__progress" dir="ltr">
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>
          ) : null}

          {ready ? null : <div aria-hidden className="hero-video__poster-wash" />}
          <div aria-hidden className="hero-video__ring" />
        </div>
      </div>
    </div>
  );
}
