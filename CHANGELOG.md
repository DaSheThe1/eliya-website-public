# Changelog

## [Unreleased]

## [0.7.1] - 2026-08-07

Fifth round of Daniel's notes, mostly on the contact section.

### Removed

- **The three ticked assurances under the contact heading** — "שם וטלפון בלבד",
  "אני חוזרת אלייך אישית, לא מוקד", "השיחה ללא עלות ובלי התחייבות". Daniel:
  *"the text above them […] says exactly the same thing. Just a duplicate and
  unnecessary."* Each one restated the lead sentence directly above it, and the
  third was phrasing he had already rejected once as contract language. The
  "and then what?" objection is still answered — by `contact.description` and by
  the privacy line under the form. `contact.assurances` is gone from the content
  type; `.contact__assurances` and `.contact__tick` are gone from the stylesheet.

### Changed

- **The contact heading**, from "בואי נדבר. אחת על אחת." to "מכאן מתחילים".
  Daniel: *"The term 'one-on-one' doesn't sound good in Hebrew."* It is a loan
  translation, and "בואי נדבר" was already on the page twice — including on the
  FAQ button that links to this very section, one scroll above the heading that
  repeated it.
- **That heading is now sized by its column, not by the viewport.** The contact
  aside is 357px wide on a phone, 480px at 768, then **collapses to 211px** when
  the two-column layout lands at 1024 before widening again — so a `vw` clamp is
  largest exactly where the column is smallest, and it wrapped a one-sentence
  heading at 1024. `.contact__pitch` is an inline-size container and the heading
  is `clamp(1.5rem, 12.6cqi, 2.6rem)`. One line at all eight sweep widths, and
  larger than the old cap at every one of them.
- **`offer.freeLabel`**, "אני נותנת לך אותה **מתנה**" → "אותה **במתנה**", at
  Daniel's instruction. The bare noun stacks two objects on one verb; `ב־` makes
  it adverbial, which is what the sentence means.
- **The hole between the contact sentence and the form on a phone**, 128px down
  to 32px. Two causes, and the smaller one was the obvious one. `.section__head`
  carries a 64px bottom margin to separate a heading block from its section
  body — but in this aside the heading block IS the column, so with the ticks
  deleted that margin became trailing dead space; it is zeroed there now. On top
  of it `.contact__layout` used one flat `gap` for both axes, right as a column
  gap above 58rem and far too much as a row gap on a phone; row and column gaps
  are now separate.
- **`.contact__aside` centres its two columns instead of top-aligning them.**
  The portrait is a fixed 312px tall and the text beside it is now four lines
  shorter, which left about 150px of void under the text at 768px.

### Fixed

- **`landing.spec.ts` "the proof galleries step with the arrows" was flaky, and
  its failure mode was a liar.** The gallery auto-advances on an interval and
  `step()` wraps to zero at the end of the track, so an advance landing between
  the test's two samples could return `scrollLeft` to exactly where it started —
  reporting a broken arrow while the arrow worked. It now hovers the gallery
  first (which pauses the interval), samples a position that has stopped moving,
  and polls for the change instead of waiting a fixed 900ms. Ten consecutive
  runs green, and the test dropped from ~13s to ~3s.

## [0.7.0] - 2026-08-07

Fourth round of Daniel's notes.

### Removed

- **The `mobile-cta` module**, at his explicit approval: *"It is fine that the
  header CTA is hidden. Just disable the footer CTA."* He had enabled it on
  2026-08-04 and questioned it on 2026-08-06 ("stuck to the bottom of the screen
  like a footer"). Disabled across the site brief, its decision record, the
  runtime contract, the generated config and the copied contract under
  `modules/`; component and styles deleted. The action on a phone is now twelve
  in-page calls to action plus the floating WhatsApp button.
- **`offer.freeNote`** ("השיחה / ללא עלות"). It restated the button one element
  below it. `freeLabel` — Daniel's line — takes its place at display size, and
  is set in **neon**: gold ink with three stacked shadows in the accent hue, and
  a slow glow-only breath gated on the site motion switch.

### Added

- **A caption band inside the player's frame, above the clip**, as on Pnina:
  "הסרטון הזה במיוחד בשבילך 👇". Inside the mount rather than above the whole
  player, which is the entire point of it.

### Changed

- **The main heading is much larger.** `.hero__intro` capped the heading at
  44rem inside a 1216px container, so 256px sat empty each side however large
  the type got. The heading now takes the container and the sub-headline keeps
  its own 40rem measure. Sizing is two-stop, because one clamp cannot serve both
  ends: 360px stops fitting one line at ~28px while the desktop container takes
  83px. Verified two visual lines at ten widths.
- **Section headings take the container too.** Same 45rem cap produced
  "שאלות שחוזרות כמעט בכל שיחה" wrapping in half at 1440. `.section__lead` keeps
  the narrow measure.
- Headings inside narrow columns are sized by the column, not the page: the
  contact aside is 298px wide and the offer's half-panel 495px, and both were
  rendering page-sized h2s that wrapped.
- Copy, all his: the proof lead, the offer heading (fourth version, and the
  first not about money), the funnel's closing line, the footer statement, and
  the trailing full stops off the FAQ questions and the first contact assurance.

### Fixed

- A spec that had been wrong twice in opposite directions — first a too-short
  fixed wait, then a "settle" helper that returned before a smooth scroll had
  started. It now polls for the condition. The wheel it doubted was fine
  throughout: measured 6842 -> 7242 at the scroll position in question.

## [0.6.0] - 2026-08-06

Third round of Daniel's 2026-08-06 notes.

### Changed

- **The hero player size is now COPIED from pnina-website and
  automations-website rather than derived.** Both size the frame by width with a
  max-width ladder and let `aspect-video` give the height:
  `sm:max-w-3xl lg:max-w-5xl xl:max-w-none` / `max-w-5xl`. That ladder is
  reproduced verbatim: 48rem from 40rem up, 64rem from 64rem up, container width
  beyond. At 1440x900 the stage went from **672x378 to 1006x566**.
  The height-driven sizing it replaces existed to keep the primary button above
  the fold, and that was never a requirement — it came from e2e specs using
  `data-cta-emphasis="played"` as a hydration signal, which only fires once the
  element has been seen. Those specs now scroll to it, which is what they should
  always have done.
- **One glow per heading, not one per line.** Each line was its own `WaveText`
  running its own clock, so a two-line heading showed two crests side by side.
  The whole heading is now a single glossed run with `<br>` between lines, so
  one crest crosses both in reading order — which is how the source
  implementation on automations-website does it.
- **Headings that are one sentence are no longer split in two.** `method`,
  `stats`, `testimonials`, `faq` and `about` were being cut mid-phrase because
  the array allowed it. The array is for sentences.
- **The offer heading, third version.** The first two described the format of
  the call ("בלי מצגת ובלי לחץ"); nobody books a call because it has no slide
  deck. It now states what the ladder underneath is proving. It deliberately
  does NOT name the price: those are placeholders (O-12) and a heading is the
  wrong place to bake in an unresolved number.
- Cookie line rewritten. The first attempt ("בלי קלוריות") was diet-culture
  register, not salon register; the joke now comes from the manicure.
- Pain's call to action is Daniel's own line: "בואי נהפוך אותך לויראלית".
- Gallery track headings are visually hidden rather than deleted — a person can
  see that a screenshot is a screenshot, but each track is a focusable scroll
  region and an unnamed one is an axe failure and an unlabelled tab stop.

### Fixed

- **The full-size viewer opened against the right edge of the screen.** A
  `<dialog>` in the top layer is positioned by its own margins and the UA
  stylesheet sets `margin: auto`; the project reset overrides that to
  `margin: 0`, which resolves to the containing block's inline-start — the RIGHT
  of an RTL document. Now centred exactly.
- **The decline button was underlined**, which reads as a link and drew the eye
  to the opt-out rather than away from it. Size and fill already carry the
  weight difference.
- **The first sub-headline line was bold and the other two were not.** A
  leftover: the rule originally set it in full ink against two muted lines, and
  when the two-tone colouring was removed the weight stayed, preserving the same
  inconsistency in a quieter form.
- Sub-headline lines no longer end in full stops. Same rule as the headings: the
  line break already ends the thought.

## [0.5.0] - 2026-08-06

Follow-up pass on Daniel's second and third rounds of 2026-08-06 notes.

### Changed

- **The hero player is 16:9 again**, with the 9:16 clip letterboxed in the
  middle over its own blurred backdrop, as on Pnina. This reverses the
  2026-08-05 decision at his instruction: the player should be the shape of the
  asset she will supply, so the swap is a file change and nothing else. About
  56% of the frame is empty either side of her, and the burned-in captions
  render small until the real master arrives (O-19).
- Sizing follows: a conservative `vh` term for short viewports, a generous
  `rem` cap for tall ones, and a `100vw`-derived term so the derived width can
  never exceed the screen. A single value was always wrong for one of the three.
- **The gold heading line is gone.** All heading text is ink and gold is only
  the crest travelling across it. The accent marked a POSITION rather than a
  meaning — always the last line, whatever it said — and a gold crest on a gold
  line is invisible, so it had needed a second champagne colour ramp invented
  purely to be seen. One mechanism, one meaning.
- **Section calls to action carry the gold fill**, not the quiet outline. The
  hierarchy argument for the outline only holds where two buttons compete in the
  same view; these sit alone, so all it bought was eight buttons that did not
  look like the site's buttons.
- **Section rhythm tightened** from `--space-section` (up to 136px a side, 272px
  between two sections) to `clamp(2.75rem, 2rem + 3vw, 4.5rem)`. Measured gap
  from a section's CTA to the next heading: ~336px before, ~170px now. The old
  value was tuned when a section ended on a paragraph, not on a button.
- The offer's lead no longer repeats "בלי מצגת ובלי לחץ" one line under the
  heading that already says it.

### Added

- **`motion/tile-video.tsx`**, the gallery's own player: whole-frame play/pause
  as a real button, a centred disc while paused, and the progress line along the
  bottom. No unmute sheet — these clips do not autoplay, so the first press is
  already that moment. Playing one pauses every other clip on the page.

### Fixed

- **The gallery tiles rendered `<video controls>`.** Chrome's overflow menu
  offers **Download** on her clients' clips, and the native bar drew an unstyled
  play/volume/fullscreen strip across her face inside an otherwise styled tile.
  Closes O-17.
- **The two clips sat hard left in a track that does not overflow.** Flex packs
  at its start and this track is `dir="ltr"` inside an RTL page. Now
  `justify-content: safe center` — `safe` matters, since plain `center` on an
  overflowing track pushes the first tiles into unreachable negative space.
- **Arrows rendered on a track with nothing to scroll.** The condition counted
  items rather than measuring overflow, so the two-clip track showed two dead
  controls pinned to the container edges. Now measured with a ResizeObserver,
  because whether eleven stills overflow depends on the viewport.
- **The cookie notice covered the fixed mobile CTA bar** on every phone — at
  390x844 the bar ran 766..844 and the notice 686..824. That bar is the
  persistent call to action on a phone and it was buried on first visit. The
  notice now stacks above the floor the bar already reserves, and the two corner
  launchers were re-measured against its new position.
- **The launcher lift stopped at 48rem on the wrong reasoning.** The notice is
  capped at 44rem, so at 768px there is only 32px of clear floor either side and
  both launchers sat under it. The threshold is now the notice's width, 56rem.
- **Copying a glossed heading pasted it twice.** Every glossed phrase exists in
  the DOM as both a hidden real string and per-letter spans, so a selection
  picked up both — which is how "בלי מצגת ובלי לחץ.בלי מצגת ובלי לחץ" happened.
  The decorative letters are now `user-select: none`, leaving one copy in the
  selection with its punctuation intact.
- A 16:9 stage on a narrow-but-tall viewport derived a width wider than the
  screen: 769px inside a 768px viewport at 768x1024.

## [0.4.0] - 2026-08-06

Second design review pass against Daniel's 2026-08-06 notes.

### Added

- **A call to action closing every argued section**, eight of them, each with
  its own line. The page had four in thirteen sections, and the hero's primary
  button and the offer's button were the identical string. A spec now asserts
  both the count and that no two labels match.
- **The letter gloss** (`ui/wave-text.tsx`), ported from automations-website
  onto the `<h1>` and all nine section headings. One crest of gold sweeps each
  line. Unlike the source it runs only while the phrase is on screen, because
  ten always-on rAF loops on a phone is a real cost for something nobody is
  looking at.
- **Alternating section grounds.** Every section on the page measured
  `background: rgba(0, 0, 0, 0)` — eleven thousand pixels of one uninterrupted
  sheet. Alternate sections now sit on a raised band; the quotes get a warm one,
  since it is the only section where someone other than her is speaking.
- The three legal pages keep their draft markers, unchanged.

### Changed

- **Every section heading is an array of finished sentences.** `#pain-title`
  measured two visual lines at 720px, broken at 720px rather than at the full
  stop. Where a heading breaks is a copy decision and now lives in the content
  file. Contract change: `title: string` -> `titleLines: string[]` on nine
  sections.
- **The cookie notice**, rebuilt to the house pattern used on pnina-website and
  automations-website: a photograph of a biscuit, one playful line, `כן, תודה` /
  `לא תודה` / `מידע נוסף`. Beauty-specific variant rather than a copy of theirs.
  The three-sentence explanation of cookieless measurement is gone from the
  notice and still available in full on the privacy page.
- **The footer.** Social links were plain text while the header two hundred
  pixels above rendered the same destinations as glyphs; it had no ground of its
  own, only a fade into the same canvas; and it asked for nothing. It now closes
  the page.
- **Social icons carry brand colour** in both the header and the footer. They
  were two identical grey circles distinguishable only by the glyph inside.
- **Voice pass on the closing sentences.** `contact.description` dropped
  "ללא עלות ובלי התחייבות", which is terms-and-conditions language at the moment
  the reader is deciding an emotional question; the reassurance moved to
  `assurances` where small print belongs. The hero's video hint no longer
  explains the player to itself.
- The offer's `titleLines`, `stats`, `proof`, `faq` and `testimonials` headings
  all rewritten to two lines.

### Fixed

- **Pressing play started the clip mid-way through.** The muted preview loops
  from load, so taking sound began wherever that loop had reached — on a sixty
  second clip, potentially four seconds from the end. `playWithSound` now
  rewinds to zero before playing.
- **The price panel took 79% of a 1440px viewport** (section 1158px, panel
  886px, of which only 504px was content). Its real waste was horizontal: a
  1136px panel around a 304px ladder. Above 64rem the heading and the ladder
  take a column each. Now 733px at 2560x1440, 658px at 1440x900.
- **Two lines of the hero heading touched.** Line one ended at y=164 and line
  two began at y=164, at `line-height: 1.08` on 54px type — with ף and ך
  descending off both of them.
- **Body copy set in the dimmest ink on the page.** `.section__lead` and
  `.pain__text` measured 9.01:1 against ink at 17.14:1. Both moved to
  `--color-ink`; the muted value itself was raised to 12.31:1 and demoted to
  captions and meta only.
- **The sub-headline was two different colours**, first line white and the rest
  muted. Weight carries the emphasis now.
- **The gallery arrows sat in the heading row**, 60px above the pictures they
  scroll. They now flank the track, centred on it, pinned with physical `left`
  and `right` because the track is `dir="ltr"` inside an RTL document.
- **The cookie notice covered the hero's primary button.** As a two-row cloud it
  was 138px tall against actions at y=760 on a 900px laptop. It is now a single
  78px row above 34rem, and on viewports under 56rem tall the hero clip yields
  the remaining height while the notice is present. Verified clear at 1280x720,
  1366x768, 1440x800, 1536x864, 1440x900, 1920x1080, 2560x1440, 768x1024 and
  390x844.
- Method's 01/02/03 removed and the glyph moved onto the heading's row. The
  numbers counted a sequence the section's own lead says is not one.

## [0.3.0] - 2026-08-05

Design review pass against Daniel's 2026-08-05 notes.

### Added

- Process journey (`#process`): a scroll-driven sticky stage ported from
  Pnina's `process-scrub`, with a complete static card fallback for the motion
  opt-out, Save-Data and no-JavaScript. Runs under the already-enabled
  `motion-native-scroll-story` module. **Footage is a marked placeholder.**
- Two proof galleries, split by media kind: snapping tracks with arrows,
  auto-advance, and a native `<dialog>` viewer that opens a still full size.
  Replaces the 4x3 wall.
- Instagram and WhatsApp glyph buttons in the header at every width.
- `/he/privacy`, `/he/terms` and `/he/accessibility`, linked from the footer.
  None existed, and the contact form's fine print had always promised a privacy
  policy.
- Thin gold line icons (`ui/line-icons.tsx`) replacing emoji in Pain and Method.

### Changed

- **Palette.** Neutrals moved off the accent's hue (ink 39deg -> 216deg) so gold
  reads as an accent; surfaces given real elevation; the gold and sea washes
  separated so complements never blend. Measured ratios recorded in
  `globals.css`.
- **Hero** is one centred column: heading, sub-headline, clip, actions. The
  heading is an array of finished sentences; the sub-headline answers
  objections instead of carrying her bio.
- Hero clip held at **9:16 native**, restoring the frozen decision in
  `INTAKE.md`; it had been letterboxed into a 16:9 stage at ~32% of the width.
- About: framed, plated portrait beside the copy.
- FAQ: constrained measure, chevron beside the question.
- Contact: her portrait and three reassurances in the aside.
- Cookie notice rebuilt as a compact bottom-centre cloud with a privacy link.

### Fixed

- **Horizontal overflow at 390px** (scrollWidth 437 vs clientWidth 390) from an
  unclipped `.hero-video__halo`. The hero was cut off on every phone.
- **Save-Data crashed the hero.** `useAllowsMediaBytes` feature-detected the
  `connection` object rather than its `addEventListener`, so a `connection`
  without one threw during subscribe and `.hero-video` rendered zero nodes.
  Pre-existing; the `motion-hero-media` Save-Data spec had been failing on it.
- Primary hero CTA fell below the fold on 720-900px laptops after the hero was
  centred; the clip is now sized by viewport height above 48rem.
- Two axe violations: duplicate `<nav>` landmark name, and the brand portrait's
  alt duplicating the adjacent text.
- Header CTA and the fixed mobile bar both rendered between 416px and 767px;
  they now hand over at exactly 48rem.
- `free-call-anchor` could stay invisible on a viewport too short to reach its
  0.35 play ratio.

## [0.2.0] - 2026-08-04

### Added

- Initial self-contained site generated from Landing Page Foundation.
