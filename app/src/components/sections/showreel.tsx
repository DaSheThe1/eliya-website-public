import { HeroMedia } from "@/components/motion/hero-media";
import type { SiteContent } from "@/content";

/**
 * The showreel: ONE clip, not two.
 *
 * ⚠️ Two clips played side by side here until 2026-08-05. Daniel: one video.
 * Two autoplaying videos competing in the same fold is noise, and neither gets
 * watched. The second clip did not go in the bin: it is a slide in the proof
 * carousel, where it plays on demand.
 *
 * Media provenance: supplied by Daniel on 2026-08-04 from her own Instagram
 * output. She is the subject and the rights holder; no third-party footage.
 *
 *   hero-a  "מה שמפריד בינך לבין ההצלחה שלך זה השיווק"  60.4s  720x1280
 *
 * Held at native 9:16 and never cropped, because the captions are burned into
 * the frame and a crop cuts the words off. Replaced with a 16:9 master when she
 * supplies one.
 *
 * Sound never starts on its own: the clip is a silent looping preview until
 * she presses the unmute control. The conversion path sits outside this
 * component, so a failed media load costs nothing.
 */
export function Showreel({ content }: { content: SiteContent }) {
  const { hero } = content;

  return (
    <div className="hero__media">
      <HeroMedia
        caption={hero.videoCaption}
        fullscreenLabel={hero.fullscreenLabel}
        label={hero.video.label}
        pauseLabel={hero.pauseLabel}
        playLabel={hero.playLabel}
        playWithSoundLabel={hero.playWithSoundLabel}
        poster={hero.video.poster}
        src={hero.video.src}
      />
    </div>
  );
}
