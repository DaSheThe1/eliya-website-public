# Cursor-responsive surface contract

Select this module explicitly during intake. Do not add a cursor effect merely
because the reference supports motion.

- Treat the effect as decorative. It must not carry meaning, cover text or
  controls, replace a native cursor, or change hit targets.
- Mount only for `(hover: hover) and (pointer: fine)`, while
  `data-site-motion="motion"` and the document is visible. Touch layouts keep
  the authored static surface with no cursor listener, canvas, or animation
  frame.
- Prefer one compositor transform or a bounded canvas region. Read layout on
  mount/resize, not every frame. Stop the loop when the effect reaches rest and
  restart only on input.
- Do not loop ambient motion. Pause and release resources on hidden documents,
  context loss, unmount, and route changes.
- Measure the real rendered surface behind text in both color schemes. If the
  effect can relight or darken a background, retain the static surface whenever
  contrast, WebGL, media, or context restoration is uncertain.
- Keep candidates behind a temporary local evaluation switch only during
  review. Once the owner selects or rejects a treatment, delete dormant
  variants and the switcher.

Pnina's approved commit contributed the fine-pointer and idle-stop gates, not a
required visual. Its shipped cursor-follower candidates were review variants;
the foundation deliberately preserves no pearl, sand, palette, or client art.
