# Showreel implementation contract

This beta module is a selectable task contract, not a prebuilt component.
Implementation must provide an approved poster, captions or transcript,
keyboard-operable controls, no autoplay with sound, a site-motion static path, and
a static fallback that preserves the conversion path when media fails.

The motion path uses the site's stored `data-site-motion` choice. It does not
read or seed from the operating system preference. Select
`motion-hero-media` separately when the reviewed brief approves muted hero
autoplay; ordinary showreel selection does not imply autoplay.

The task packet must name each media source and license. Until the component,
media, and browser tests exist in the generated client repository, this module
blocks preview and release.
