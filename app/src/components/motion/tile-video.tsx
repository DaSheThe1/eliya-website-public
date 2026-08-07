"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The gallery's video player.
 *
 * ⚠️ THESE TILES USED TO RENDER `<video controls>` — the browser's own bar.
 *
 * Daniel, 2026-08-06: *"the video player of the gallery shouldn't have that
 * stuff like download and three-dot options. It probably needs to have the same
 * player that we use in the hero video, just without the big thing in the
 * middle before you play it one time, so just the pause, I think, like the
 * resume button. Again we're going to have the video play time in the bottom as
 * the moving line."*
 *
 * The native bar was not just ugly here, it was leaky: Chrome's overflow menu
 * offers **Download**, and these are her clients' clips. It also drew a play
 * bar, a volume slider and a fullscreen button across her face inside a tile
 * that is otherwise fully styled, so the one unstyled rectangle on the page was
 * the one with a person in it.
 *
 * ── WHAT THIS SHARES WITH THE HERO PLAYER ──
 * The whole frame is a real `<button>`, not a click handler on the `<video>`: a
 * bare handler is invisible to a keyboard and to a screen reader. A centred
 * disc shows while paused, because otherwise a paused clip is indistinguishable
 * from a broken one. The progress line fills left to right under `dir="ltr"`,
 * explicitly, because the document is RTL and it would otherwise drain from the
 * wrong end — and it is an indicator, not a scrubber, so it takes no pointer
 * events and cannot steal taps from the frame behind it.
 *
 * ── WHAT IT DELIBERATELY DOES NOT SHARE ──
 * There is no unmute sheet and no first-press ceremony. The hero clip autoplays
 * muted and needs a considered "start it with sound" moment; these do not play
 * until asked, so the first press already IS that moment. Daniel asked for
 * exactly this: "without the big thing in the middle before you play it one
 * time."
 *
 * `preload="none"` stays. Two clips that nobody has asked for should not cost
 * anyone a byte, and `controlsList` plus `disablePictureInPicture` remain as a
 * second line of defence for any browser that surfaces its own UI regardless
 * (iOS Safari forces a native control set in fullscreen, which is out of the
 * page's hands and is fine — fullscreen is the one place scrubbing belongs).
 */
// iOS Safari has no Element.requestFullscreen; the clip expands through the
// native player via this vendor method instead. Same shape as the hero player.
type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export function TileVideo({
  src,
  poster,
  label,
  playLabel,
  pauseLabel,
  muteLabel,
  unmuteLabel,
  fullscreenLabel,
}: {
  src: string;
  poster: string;
  label: string;
  playLabel: string;
  pauseLabel: string;
  muteLabel: string;
  unmuteLabel: string;
  fullscreenLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      setProgress(video.currentTime / video.duration);
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, []);

  /*
   * ⚠️ ONE CLIP AT A TIME, ACROSS THE WHOLE PAGE.
   *
   * Both gallery clips sit in the same track, and the hero clip is a few
   * thousand pixels up the same document. Without this, pressing play on the
   * second tile leaves the first one talking underneath it — two of her voices
   * over each other, and no obvious way to work out which tile to press to stop
   * it. Pausing every other media element on play is the only reliable fix,
   * because there is no shared state between these components by design.
   */
  function pauseEveryOtherClip(self: HTMLVideoElement) {
    document.querySelectorAll("video").forEach((other) => {
      if (other !== self && !other.paused && !other.muted) other.pause();
    });
  }

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      pauseEveryOtherClip(video);
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }

  /*
   * ⚠️ MUTE AND FULLSCREEN WERE BOTH MISSING, AND THAT WAS AN OVERSIGHT.
   *
   * Daniel, 2026-08-07: *"there is no option to mute/unmute full screen on the
   * video there."* The note at the top of this file explains at length why the
   * browser's own control bar had to go, and then replaced it with only
   * play/pause and a progress line — so removing the leaky Download menu also
   * removed the volume control and the fullscreen button, which are the two
   * controls a visitor most reasonably expects on someone else's video.
   *
   * These are her clients speaking. Sound is the whole point of the clip, so it
   * plays unmuted — but a person opening a page at work, or beside someone
   * asleep, needs to be able to silence it in one press without hunting for the
   * tile that is talking. And a phone screenshot inside a small tile is exactly
   * the thing you want to make bigger.
   *
   * `pauseEveryOtherClip` above is deliberately NOT relaxed to match. One clip
   * at a time is correct: two of her clients talking over each other, with no
   * way to tell which tile to press to stop it, is worse than the wait.
   */
  function toggleMuted() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
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
    <div className="tile-video">
      <video
        aria-label={label}
        className="tile-video__clip"
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        playsInline
        poster={poster}
        preload="none"
        ref={videoRef}
        src={src}
      />

      <button
        aria-label={playing ? pauseLabel : playLabel}
        className="tile-video__tap"
        onClick={toggle}
        type="button"
      >
        {!playing ? (
          <span aria-hidden className="tile-video__disc">
            <svg focusable="false" viewBox="0 0 24 24">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
        ) : null}
      </button>

      {/* ⚠️ THE CORNER SITS ON TOP OF THE FULL-FRAME PLAY BUTTON, so these two
          need their own stacking context — otherwise a press meant for mute
          lands on play/pause behind it and does both. */}
      <div className="tile-video__corner">
        <button
          aria-label={muted ? unmuteLabel : muteLabel}
          className="tile-video__icon-button"
          onClick={toggleMuted}
          type="button"
        >
          {muted ? (
            <svg aria-hidden fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
              <path d="M16 9l5 6M21 9l-5 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg aria-hidden fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <button
          aria-label={fullscreenLabel}
          className="tile-video__icon-button"
          onClick={expand}
          type="button"
        >
          <svg aria-hidden fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ⚠️ dir="ltr" and a left transform origin, explicitly. See the note
          above: an RTL document drains this from the wrong end otherwise. */}
      <div aria-hidden className="tile-video__progress" dir="ltr">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
