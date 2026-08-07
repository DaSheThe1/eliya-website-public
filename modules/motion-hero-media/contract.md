# Hero media motion contract

Select this module only when the owner approves hero autoplay and the media,
poster, captions/transcript, performance budget, and fallback are ready.

- Autoplay is muted, `playsInline`, and present declaratively in server HTML so
  iOS can start before hydration. A client effect may retry and observe failure;
  it must not be the only autoplay path.
- Provide an always-visible pause/play control with a minimum 44px target for
  content moving longer than five seconds. Do not hide it behind hover.
- Keep a real poster and a designed static fallback beneath the video. Blocked
  autoplay, Low Power Mode, slow media, or a missing source must leave a
  complete hero and conversion path.
- The site's stored motion opt-out pauses autoplay. An explicit press may still
  play media because that is user-controlled content, not ambient motion.
- If the reviewed interaction changes from silent preview to sound, restart
  from the approved point, disable looping, expose controls, and invoke
  fullscreen synchronously inside the gesture. Fullscreen failure is additive:
  inline playback must continue.
- Never autoplay with sound. Do not loop a pressure cue, pulse a play affordance,
  or suppress captions. Track only an approved coarse watch event; never media
  contents or sensitive form data.

The source site's client footage, poster, identity, wording, analytics event,
aspect ratio, and fullscreen styling are excluded.
