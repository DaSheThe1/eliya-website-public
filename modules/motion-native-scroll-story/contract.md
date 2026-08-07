# Native-scroll story contract

Select this beta module only when the reviewed brief explicitly chooses a
scroll-driven media story. Selection does not authorize client copy, imagery,
step count, timing, or art direction from another site. Freeze the project
configuration against `schemas/motion-native-scroll-story.schema.json`.

The reusable behavior is derived from the completed Pnina implementation at
private commit `0165b9b3fe37481944ef2c1dbb80c232660648d3` (public mirror
`87912f8`). The foundation contains no Pnina identity, copy, assets, URLs, or
private planning material.

## Required structure

- Render the final track and sticky-stage geometry in the first server HTML.
  Do not swap a taller interactive section in after hydration or media probes.
- Render step one visibly before JavaScript or media. Keep the complete ordered
  story available as static cards and as independent semantic reading-order
  content. Decorative video is `aria-hidden`.
- Use one approved local poster under one short-GOP H.264 cut per orientation.
  Keep the poster visible until a requested video frame has actually painted.
- Map native document scroll continuously to copy position and media time.
  Coalesce seeks; never build a seek queue or a client-side decoded frame burst.
- Keep touch and wheel browser-owned. Do not call `preventDefault`, lock the
  body, install root scroll snap, or replace the section with a fixed overlay.
- If the brief approves phone settling, wait for native scrolling and momentum
  to finish. A deliberate touch advances at most one adjacent station; a tiny
  movement and non-touch input choose the nearest station. A fresh gesture
  cancels only the component's own smooth settle.
- Let outward gestures at either endpoint leave immediately. After a completed
  forward story, a reverse gesture that finishes above the whole journey stays
  there rather than being pulled back.

## Media and failure gates

- Assign no media URL until hydration, near-viewport eligibility, the in-site
  motion choice, and Save-Data have all passed.
- The operating system `prefers-reduced-motion` signal is not an input. The
  shared `data-site-motion` choice starts at `motion`, is stored by the site's
  own control, and switches to the complete static rendering without a flash.
- Save-Data is a byte gate. It selects the static rendering and makes zero
  process-media requests even though the site's motion preference remains on.
- A delayed, failed, or missing video changes neither section geometry nor copy
  availability. Keep the poster and continue normal navigation.
- On cleanup, pause the video, remove its source, reload the element to release
  the decoder, and remove listeners, observers, timers, and animation frames.
- Pause work while the document is hidden. Do not run an ambient or looping
  animation behind content.

## Acceptance evidence

Run the pure reference tests plus hermetic browser coverage with tiny local
media. Verify cold/delayed media, stable geometry, intermediate copy, one
orientation source, coalesced seeks, failed video, site opt-out, Save-Data,
reload restoration, outward exits, multi-touch, a new gesture during settling,
and the page sections on both boundaries. Chromium is not an iPhone; record an
iOS Simulator or physical-device pass for Safari scrolling, toolbar changes,
decode pressure, rotation, and background/foreground behavior.
