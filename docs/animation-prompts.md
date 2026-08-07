# Process animation — image generation prompts

Working log for the scroll-story animation that replaces the placeholder
footage in the `process` section (closes O-14).

All prompts below are **beat 1** (the "before" state). Beats 2–5 get added
once beat 1 is locked.

---

## Invariants — true in every version, every beat

These do not change between versions. If a prompt drops one of these, it is a
mistake, not a variation.

- **9:16 vertical.** A separate 16:9 set follows later; nobody ever sees both.
- **Palette:** deep navy / near-black, warm gold light, cream, soft beige. Dark
  overall, lit from within. Any green muted and aged, never bright.
- **No text anywhere.** No letters, words, numbers or signage. The **dollar
  sign on the banknotes is the only symbol permitted** — it says *money*
  without stating an amount.
- **Calendar marks are small filled blocks inside cells, never handwriting.**
  Handwriting cannot scale to "wall to wall booked" at beat 3, and cannot
  change weight or colour to show the price rise at beat 4.
- **Calendar on the right, piggy bank on the left.** RTL reading order: how
  full is she first, what it is worth second.
- **The storefront must be wide enough to hold three or four people standing
  outside looking in.** Needed at beat 5. Cheap now, a redraw later.
- **The room never upgrades.** Same furniture, same camera, same positions in
  all five beats. What changes is her posture, who is in the room, the light,
  the calendar and the piggy bank. Nothing else.

## Production rule

Once beat 1 is locked, **stop prompting from scratch.** Generate beats 2–5 as
edits of the locked frame, changing only what the beat changes. Fresh
generations drift the furniture and the scrub will look like five different
salons instead of one room over a month.

---

## v1 — "all in the room"

Everything diegetic: piggy bank hanging, planner on the back wall, tight crop
on the interior.

**Output:** `assets/animation/v1-all-in-the-room.png`
**Verdict:** Style, palette and props all correct. Two problems — the top ~45%
is dead space containing nothing that animates, and the storefront is a sliver
too narrow to hold the beat-5 crowd.

```
Vertical 9:16 illustration. A warm, premium beauty studio at night with
a high ceiling, seen from inside, straight on. Cinematic editorial
illustration, clean shapes, soft gradients. Not flat vector, not
photorealistic.

Palette: deep navy and near-black shadow, warm gold light, cream and
soft beige. Dark overall, lit from within. Any green is muted and aged,
never bright.

Tall narrow composition. Very little floor, very little street.

UPPER: a high ceiling. The air near the ceiling falls into deep shadow,
unlit and empty. Nothing occupies it.

Suspended from the ceiling on the left, large and impossible to miss: a
big transparent piggy bank of clear glass or acrylic, an oversized
display vessel hanging in the air. It is nearly empty — only a few
loose bundles of paper money lying at the bottom, banknotes marked with
dollar signs.

BACK WALL, right of centre and large: a wall planner, a month grid
taking up a major portion of the wall. Almost entirely empty, only two
or three small marks on it.

MIDDLE AND LOWER: the studio. One empty reclining treatment chair,
suitable for nails, brows or facials. A tidy work surface with tools, a
tall mirror, a warm arc lamp, a plant. A folded ring light and tripod
in the corner. A woman in her late twenties, the studio owner, sits
alone on a stool beside the empty chair, looking down at the phone in
her hand. Patient and a little defeated, not dramatic. The room is
beautiful and well cared for.

EDGE: a narrow slice of glass storefront at one side, dark empty street
beyond. Nobody outside, nobody passing.

No text anywhere. No letters, no words, no numbers, no signage, no
readable writing. The wall planner shows only blank cells and abstract
marks. The only symbol permitted in the image is the dollar sign on the
banknotes.
```

---

## v2 — "three bands"

Text band, studio band, instruments band. The separated layout.

**Output:** `assets/animation/v2-three-bands.png`
**Measured result:** text 24%, studio 25%, instruments 51% — the studio came
out as the *smallest* zone.
**Verdict:** Instruments finally legible (each ~45% of frame width), and the
full-width storefront is a real win for beat 5. But hard horizontal seams read
as UI rather than film once things move, the bottom band floats on black as a
dashboard, and the text sits on a plain bar with no relationship to the
picture. What this version proved is that the instruments need that **scale**
— not that they need their own band.

```
Vertical 9:16 illustration, split into three horizontal zones.
Cinematic editorial illustration, clean shapes, soft gradients. Not
flat vector, not photorealistic.

Palette: deep navy and near-black shadow, warm gold light, cream and
soft beige. Dark overall. Any green is muted and aged, never bright.

TOP ZONE, roughly a quarter of the frame: empty dark space. Deep navy,
almost black, with a faint warm glow rising from below. Completely
empty — no objects, no detail.

MIDDLE ZONE, roughly 40 percent: a warm, premium beauty studio at
night, seen from inside, straight on, wide. One empty reclining
treatment chair suitable for nails, brows or facials. A tidy work
surface with tools, a tall mirror, a warm arc lamp, a plant. A folded
ring light and tripod in the corner. A woman in her late twenties, the
studio owner, sits alone on a stool beside the empty chair, looking
down at the phone in her hand. Patient and a little defeated. Behind
her, a glass storefront onto a dark empty street. Nobody outside.

BOTTOM ZONE, roughly a third, on a dark background separated from the
studio above: two large objects side by side, lit warmly.
  On the RIGHT: a large wall planner, a month grid, almost entirely
  empty with only two or three small marks on it.
  On the LEFT: a large transparent piggy bank of clear glass or
  acrylic, nearly empty, with only a few loose bundles of paper money
  at the bottom, banknotes marked with dollar signs.

No text anywhere. No letters, no words, no numbers, no signage, no
readable writing. The planner shows only blank cells and abstract
marks. The only symbol permitted in the image is the dollar sign on the
banknotes.
```

---

## v3 — revised "all in the room"

v1 with the two instruments raised into the dead top half and enlarged, so
they sit side by side at the same height and can be compared in one glance.
Adds pendant lights to motivate the room's lighting and fill the top edge.
Adds the wide storefront and the filled-block calendar marks.

**Output:** `assets/animation/v3-revised-room-REJECTED.png`
**Verdict:** Rejected. The studio came out as a sealed glass vitrine with no
door, small and boxed into the lower right with no room for a crowd at beat 3.
Calendar reverted to handwriting squiggles. Beautiful frame, cannot carry the
rest of the story.

```
Vertical 9:16 illustration. A warm, premium beauty studio at night with
a very high ceiling, seen from inside, straight on. Cinematic editorial
illustration, clean flat shapes with soft gradients, elegant and muted.
Not photorealistic.

Palette: deep navy and near-black, warm gold light, cream and soft
beige. Dark overall, lit from within. Any green is muted and aged.

VERTICAL LAYOUT, top to bottom:

Top 20%: dark empty air. Only two or three thin pendant cords dropping
from the ceiling. Nothing else, no objects.

At 20-30%: the pendant lamp fixtures on those long cords, small brass
shades casting soft warm cones of light downward into the room.
Currently dim.

30-55%, side by side at the same height, both large and roughly equal
in visual weight:
  LEFT: a big transparent glass piggy bank hanging from the ceiling on
  a cord. Nearly empty, only a few loose banknotes with dollar signs
  lying at the bottom.
  RIGHT: a large wall planner mounted high on the back wall, a month
  grid. Almost entirely empty: only two or three small pale beige
  blocks filling individual cells. The marks are small filled
  rectangles inside cells, never handwriting.

55-100%: the studio at floor level. One empty cream reclining treatment
chair, suitable for nails, brows or facials. A work surface with
brushes and tools, a tall slim gold mirror, a warm arc floor lamp, a
plant. A folded ring light on a tripod standing unused. A woman in her
late twenties, the studio owner, sitting alone on a small stool beside
the empty chair, in profile, looking down at the phone in her hand.
Patient and a little defeated, not dramatic. The room is beautiful and
well cared for.

LEFT EDGE, running the full height of the lower half: a generous glass
storefront, wide enough to clearly show several people standing outside
it. Beyond it a dark, empty street. Nobody outside, nobody passing.

No text anywhere. No letters, no words, no numbers, no signage, no
readable writing. The planner contains only blank cells and small
filled blocks. The only symbol permitted in the image is the dollar
sign on the banknotes.
```

---

## v4 — "depth, not zones"

The synthesis of v2 and v3. Keeps v2's instrument scale and full-width
storefront, but gets there through **foreground depth** instead of stacked
bands: the piggy bank and planner are close to the camera and therefore large,
with the studio receding behind them and the floor running continuously
underneath. One space, no seams, no dashboard.

**Output:** `assets/animation/v4-depth-not-zones-LEADER.png` — **the leader.**
**Measured:** text 25%, studio 40%, instruments 24%. Good proportions.
**Verdict:** The only version where the calendar marks came out as **filled
blocks** rather than handwriting — which is the mark type the whole rest of the
story depends on. Also the only one with a door to the street, and the only one
where both instruments are large, adjacent and lit. Two fixes needed, carried
into v5.

An inverted variant with the instruments *above* the studio was also tried
(`Gemini_Generated_Image_n1sdjfn1sdjfn1sd.png`) and rejected: the calendar came
out dark navy on dark navy, which puts the two objects that must be read into
shadow, and five pendant cords crossed the calendar.

```
Vertical 9:16 illustration. A warm, premium beauty studio at night, one
continuous room seen with depth. Cinematic editorial illustration,
clean flat shapes with soft gradients, elegant and muted. Not
photorealistic.

Palette: deep navy and near-black, warm gold light, cream and soft
beige. Dark overall, lit from within. Any green is muted and aged.

ONE SINGLE CONTINUOUS SPACE. No horizontal dividing bands, no panels,
no cut lines across the image. Depth is created by near and far, not by
zones.

TOP 20%: dark unlit air near a high ceiling. A few recessed downlights
and two thin pendant cords at the very top edge, casting soft warm
light downward. Nothing else occupies this area.

MIDDLE, the studio in the background, full width: a glass storefront
running the whole back wall, wide and generous, looking out onto a
dark empty street. Nobody outside, nobody passing. Inside: one empty
cream reclining treatment chair suitable for nails, brows or facials, a
work surface with brushes and tools, a tall slim gold mirror, a plant,
a warm arc floor lamp, a folded ring light on a tripod standing unused.
A woman in her late twenties, the studio owner, sitting alone on a
small stool beside the empty chair, looking down at the phone in her
hand. Patient and a little defeated, not dramatic.

FOREGROUND, lower third, close to the camera and therefore large. Both
fully visible, in sharp focus, not cropped, not overlapping each other.
The studio floor continues underneath them with no edge or border.
  LEFT: a big transparent glass piggy bank hanging low on a long cord
  from the ceiling, near the camera. Nearly empty, only a few loose
  banknotes with dollar signs lying at the bottom.
  RIGHT: a large wall planner on the near wall, a month grid, roughly
  the same visual size as the piggy bank. Almost entirely empty: only
  two or three small pale beige blocks filling individual cells. The
  marks are small filled rectangles inside cells, never handwriting.

No text anywhere. No letters, no words, no numbers, no signage, no
readable writing. The planner contains only blank cells and small
filled blocks. The only symbol permitted in the image is the dollar
sign on the banknotes.
```

---

## v5 — v4, corrected

v4 with three changes and nothing else touched:

1. **The cord to the piggy bank is gone.** In v4 it ran the full height of the
   frame and sliced the composition in two, straight through the studio. Both
   the piggy bank and the calendar now float unsupported as a matched
   foreground pair — one unsupported object reads as an error, two matching
   ones read as a deliberate device.
2. **A waiting bench added.** There was nowhere in the room for a crowd, and
   beat 3 needs the studio crammed. Free now, a redraw later.
3. **The upper area carries a soft warm glow** rather than flat black. It sits
   behind a frosted copy panel (72% opaque, 10px backdrop blur) so no *object*
   animated there would be visible — but light reads through frosted glass.
   That glow going from cold and dim at beat 1 to warm and full at beat 5 is
   the top zone's animation.

Everything else from v4 is deliberate and must survive: the filled-block
calendar marks, the door, the full-width storefront, the band proportions, the
pendant and recessed lighting, the pose.

**Output:** `assets/animation/v5-candidate-a.png` and `v5-candidate-b.png`,
generated 2026-08-07. Candidate A executes the brief: piggy bank left and
calendar right, both large in the upper dark, one continuous room below, marks
as filled blocks, storefront running the full height at the left edge. Not yet
picked. Run it several times and pick, then **lock** —
beats 2–5 are edits of the locked frame, never fresh generations.

```
Vertical 9:16 illustration. A warm, premium beauty studio at night, one
continuous room seen with depth. Cinematic editorial illustration,
clean flat shapes with soft gradients, elegant and muted. Not
photorealistic.

Palette: deep navy and near-black, warm gold light, cream and soft
beige. Dark overall, lit from within. Any green is muted and aged.

ONE SINGLE CONTINUOUS SPACE. No horizontal dividing bands, no panels,
no cut lines across the image. Depth is created by near and far, not by
zones.

TOP 25%: dark air near a high ceiling, carrying a soft warm glow that
fades upward rather than flat black. Two slim pendant lamps hang from
the ceiling into this area on short cords, currently dim. No other
objects.

MIDDLE 40%, the studio in the background, full width: a glass
storefront running the whole back wall, wide and generous, WITH A GLASS
DOOR to the street clearly visible at one side. Beyond it a dark empty
street. Nobody outside, nobody passing. A row of small recessed
downlights in the ceiling above. Inside: one empty cream reclining
treatment chair suitable for nails, brows or facials; a work surface
with brushes and tools; a tall slim gold mirror; a small upholstered
waiting bench against the near wall, empty; two plants; a warm arc
floor lamp; a folded ring light on a tripod standing unused. A woman in
her late twenties, the studio owner, sitting alone on a small stool
beside the empty chair, looking down at the phone in her hand. Patient
and a little defeated, not dramatic.

FOREGROUND, lower third, close to the camera and therefore large. Two
objects, side by side, both fully visible, in sharp focus, not cropped,
not overlapping each other, aligned at the same height. Both float
freely in the foreground with NO cord, NO string, NO wire and NO
support of any kind attached to either one. Nothing hangs from the
ceiling to reach them.
  LEFT: a big transparent glass piggy bank. Nearly empty, only a few
  loose banknotes with dollar signs lying in the bottom of its belly.
  RIGHT: a large calendar, a month grid, roughly the same visual size
  as the piggy bank, on a cream panel so it reads bright against the
  dark. Almost entirely empty: only two or three small beige blocks
  filling individual cells. The marks are small filled rectangles
  inside cells, never handwriting, never letters or numbers.

No text anywhere. No letters, no words, no numbers, no signage, no
readable writing. The calendar contains only blank cells and small
filled blocks. The only symbol permitted in the image is the dollar
sign on the banknotes.
```

---

## Decision

**v4's layout wins; v5 is it corrected.** Generate v5 several times, pick the
best, and lock it before touching beats 2–5.

The test for any candidate is not whether beat 1 looks good — it's whether you
can picture **beat 3** in it: room crammed with clients, calendar wall to wall,
piggy bank barely moved, all three readable at once. That is the frame the
whole story turns on, and it is what killed v3.

## Reference images to attach

- **"squid game piggy bank"** — the vessel. Most important; a still is clearer
  than any sentence.
- **"dark luxury beauty salon interior warm lighting"** — the room, ceiling
  height and lighting mood.
- `app/public/media/photo/eliya-about.jpg` — the beach-at-sunset photo the
  site palette derives from. **Only if the tool has a separate style-reference
  slot**, otherwise it will try to put a beach in the picture.
- Do **not** attach a calendar reference. Any real planner image carries text
  and the model will copy it straight in.

---

# Beat 1 — LOCKED

`Gemini_Generated_Image_pvx2x4pvx2x4pvx2.png` (v5, third generation).

Everything the story needs is in the room: door to the street, full-width
storefront, waiting bench, empty treatment chair, ring light folded and unused
on its tripod, mirror, desk, two plants, pendant and recessed lighting, warm
glow in the text zone, floating piggy bank with the notes low in its belly, and
a bright cream calendar carrying four small beige blocks.

**All remaining beats are edits of this frame. Nothing new gets invented.**

---

# The five beats

The story, from `pain` and `method`: she is a professional nobody knows about;
she becomes visible; she gets busy at the wrong price; she raises it and holds
her nerve; she ends up with fewer hours and more money.

| Beat | What happens | Piggy bank | Calendar |
| --- | --- | --- | --- |
| 1 | Quiet. Good work, empty chair, silent phone | ~10% | 4 small pale blocks |
| 2 | She gets on camera | ~10% *unchanged* | 4 small pale blocks *unchanged* |
| 3 | Full — but the wrong full. Crammed, cheap, running late | ~30% | nearly every cell filled, small pale blocks |
| 4 | She raises the price. Gaps open. The held breath | ~35% *barely moved* | ~10 blocks, some now large and gold, several cells visibly emptied |
| 5 | Fewer hours, better week | ~85% | ~14 large gold blocks with clear empty gaps |

Two things carry the whole argument and must not be softened:

- **Beat 2 pays off nothing.** The calendar and the piggy bank do not move. She
  does the work and gets nothing yet. That honesty is what makes beat 3 land.
- **Beat 4's piggy bank barely moves.** The nerve is at 4, the reward is at 5.
  If the money jumps the moment she raises the price, the tension evaporates
  and the risk looks free.

**Time of day:** the interior lighting stays constant in all five. Only what is
visible *through the glass* changes — night for beats 1 to 4 (she is still
working late, which is the point at beat 3), golden late afternoon at beat 5.
That carries "she no longer works nights" without relighting the room, and
keeps the change local for the interpolation.

**Wardrobe and camera never change.** Same cream top, same dark trousers, same
angle, same furniture in the same places, all five beats.

## Eliya is in the room, beats 2 to 4

Daniel's decision. She is physically present, not a call on a screen.

**Absent at beat 1, present at beats 2, 3 and 4, absent at beat 5.** One
entrance and one exit, which is the whole reason she stays through beat 3
rather than appearing only at the two decisions: a body that appears, vanishes,
returns and vanishes again is four entrances and exits for the video model to
invent, and every one of them is a place the interpolation can break.

It also reads better. Beat 1 is before the help, beats 2 to 4 are the work
together, beat 5 is after — she is gone and the business remains. And her being
present at beat 3 makes beat 4 causal rather than arbitrary: she is standing
there watching the woman drown in cheap appointments, which is *why* the price
goes up in the next frame.

**Her exit is covered by the time change.** Beat 4 is night, beat 5 is golden
late afternoon. Days have passed, so nobody expects the same people in the
room. That jump is the licence for her absence and it needs no walking-out shot.

### Telling the two women apart

The viewer must know instantly which one she is supposed to be. Never ambiguous:

| | Studio owner | Eliya |
| --- | --- | --- |
| Clothes | cream top, dark trousers | **black blazer**, structured |
| Hair | as locked in beat 1 | dark, distinct from the owner's |
| Doing | working, filming, being looked at | guiding, watching, gesturing |
| Never | — | never touches a client, never works, never centre frame |

At beat 2 the ring light pools cold white on the **studio owner** while Eliya
stands outside that pool in the warm room light. The spotlight is literally on
the viewer's stand-in; Eliya is support.

**Likeness:** recognisable type, not a portrait. Dark hair, black blazer, to
match `eliya-phone-blazer.jpg` elsewhere on the page. An accurate drawn face
sitting near her real photographs is where illustrated likenesses go wrong.

⚠️ She first appears between beat 1 and beat 2, which is the transition most
likely to break. If it does, the fallback is to have her already stepping
through the door in beat 2 so the interpolation has somewhere to bring her
from, rather than materialising mid-room.

---

## Beat 2 — she gets on camera

Edit from **beat 1**.

```
Using this image, keep the room, the camera angle, the furniture, the
lighting and the woman's clothing exactly as they are. Change only the
following:

The ring light on its tripod is now set up and switched on, glowing
white, turned to face into the room. Her phone is mounted on the
tripod inside the ring, no longer in her hand.

She is standing in front of the ring light, facing the camera on the
tripod, filming herself. Upright, a little self-conscious but doing it
anyway. Her stool is empty behind her.

A SECOND WOMAN is now in the room, off to one side: her coach, in her
thirties, dark hair, wearing a structured BLACK BLAZER so she is
instantly distinguishable from the studio owner in her cream top. She
is standing beside the tripod, one hand raised mid-gesture, directing
and encouraging her. She is not touching anything and not working. She
is clearly the helper, not the subject.

A cool white pool of light from the ring light falls on the STUDIO
OWNER, who remains the centre of the picture. The coach stands outside
that pool, in the warmer, dimmer room light, and is smaller and further
to the side in the frame.

EVERYTHING ELSE IS IDENTICAL. The treatment chair is still empty. The
waiting bench is still empty. The street outside is still dark and
empty with nobody passing. The calendar still has exactly the same four
small beige blocks in the same cells, unchanged. The piggy bank still
has exactly the same few notes lying in the bottom of its belly,
unchanged. No text anywhere.
```

## Beat 3 — full, but the wrong full

Edit from **beat 2**.

```
Using this image, keep the room, the camera angle, the furniture, the
lighting and the woman's clothing exactly as they are. Change only the
following:

The studio is crowded and hectic. A client is lying in the treatment
chair being worked on. Two more women are sitting waiting on the
bench, and one more is just coming through the door from the street.

The woman who owns the studio is standing over the treatment chair
working, hurried and tense, hair coming loose, not smiling. The ring
light is switched off and pushed aside.

The coach in the black blazer is still in the room but pushed to the
edge of it, standing back against the near wall out of the way,
watching the chaos. Arms folded, not helping, not working on anyone,
just observing what is happening. She is small in the frame.

The calendar is now almost completely full: nearly every cell carries a
small pale beige block, the same small size and same pale colour as
before, just many more of them.

The piggy bank has risen a little but is still low — notes filling
roughly the bottom third of its belly.

EVERYTHING ELSE IS IDENTICAL. Same room, same angle, same furniture in
the same places. The street outside is still dark and it is still
night. No text anywhere.
```

## Beat 4 — she raises the price

Edit from **beat 3**.

```
Using this image, keep the room, the camera angle, the furniture, the
lighting and the woman's clothing exactly as they are. Change only the
following:

The studio has emptied out. Only one client remains in the treatment
chair. The waiting bench is empty. Nobody is at the door.

The woman is standing still, arms at her sides, looking towards the
calendar. Uncertain, holding her breath. Not sad, not happy — waiting.

The coach in the black blazer is standing next to her, at her shoulder,
both of them facing the calendar together. Calm and steady, not
gesturing. The two women side by side, looking at the same thing. The
studio owner is still the one closest to the centre of the picture.

The calendar has changed character. Most of the small pale blocks are
gone, leaving visibly empty cells. About ten blocks remain and some of
them are now noticeably LARGER and GOLD instead of small and pale. The
grid reads emptier than it did, with clear holes in it.

The piggy bank is almost exactly where it was — barely any more money
than the previous frame. It has NOT filled up.

EVERYTHING ELSE IS IDENTICAL. Same room, same angle, same furniture in
the same places. The street outside is still dark and it is still
night. No text anywhere.
```

## Beat 5 — fewer hours, better week

Edit from **beat 4**.

```
Using this image, keep the room, the camera angle, the furniture and
the woman's clothing exactly as they are. Change only the following:

Through the storefront glass it is now golden late afternoon instead of
night — warm daylight outside. Three or four women are standing on the
pavement outside the glass, stopped, looking in. They are outside, not
inside. The room stays calm.

One client is lying in the treatment chair, relaxed, being worked on
unhurried. The waiting bench is empty.

The woman who owns the studio is standing upright beside the chair,
calm and unhurried, quietly pleased. Hair tidy.

The coach in the black blazer is GONE. There is no second woman
anywhere in the room. The studio owner is the only person working here.
She is doing this on her own now.

The calendar now carries about fourteen blocks, all of them LARGE and
GOLD. They are spread out with clear empty gaps between them — whole
cells and at least one full row left deliberately empty.

The piggy bank is nearly full, banknotes stacked up to its shoulders.

EVERYTHING ELSE IS IDENTICAL. Same room, same angle, same furniture in
the same places, same interior lamps still on. No text anywhere.
```

---

# Drift check before rendering

Chaining each beat from the previous one keeps adjacent frames consistent,
which is what the interpolation needs — but small changes accumulate. Before
committing to video:

1. Put **beat 1 and beat 5 side by side.** The room must be the same room —
   same chair position, same bench, same door, same mirror, same plants. If it
   has drifted, regenerate the tail from an earlier locked frame.
2. Check the **piggy bank and calendar are in identical positions** in all five.
   Their levels are only comparable if they do not move.
3. Check the **calendar block sizes** actually read as two distinct kinds:
   small pale (beats 1–3) versus large gold (beats 4–5). If they look the same,
   the price rise is invisible and beat 4 means nothing.

---

# Video pipeline

Five stills become four transitions, generated as first-frame / last-frame
interpolations (beat 1 → 2, 2 → 3, 3 → 4, 4 → 5), then concatenated into one
clip that the scrub seeks through.

Constraints the clip must satisfy, because it is scrubbed rather than played:

- **No camera movement and no cuts.** One fixed frame throughout. A scroller
  can stop anywhere, including mid-transition.
- **No motion blur or fast whips.** Every intermediate frame has to look right
  held still, not just the five beats.
- **Each beat must hold.** The copy rail moves between 34% and 66% of each
  interval, so the picture should rest at each state and do its changing in the
  middle third of each segment.
- Equal-length segments, unless the beat weighting change goes in — see below.

Two open implementation items:

- **Beat weighting.** Beats 3 and 4 deserve more scroll than 1 and 2. That
  needs a code change, not a longer segment: video time and copy position must
  both derive from one weighted position value, or the picture desyncs from the
  words. Currently the seek uses raw progress and the rail assumes four equal
  quarters.
- **Five beats, not four.** `process-scrub.tsx` has `STATIONS = 4` and the copy
  rail is `width: 400%` translating by `-position * 100 / 4`. Both need to
  become five, along with five steps of copy in `site-content.ts`.

---

# Backlog

**Ambient idle layer.** The scrub is stale whenever the visitor stops
scrolling, because in a scrubbed video time *is* scroll position. Fixing it
needs a second layer with its own clock: a short looping video, identical
dimensions and identical `object-fit: cover` so it aligns with the base
automatically at any viewport ratio, composited with `mix-blend-mode: screen`
so black is transparent and no alpha channel is needed.

Contents, in order of worth: headlights crossing the street behind the glass
(at beat 1 it reads as *the world going past while nobody comes in*), a slow
breathe on the warm ceiling glow, a specular highlight drifting across the
piggy bank glass. All are additive light, which is all `screen` can do — no
swaying plants, no moving shadows. The calendar stays perfectly still; motion
there would read as a state change.

Must pause when the section is off-screen, and must not load at all under
Save-Data or reduced motion. Its opacity can be driven from the scroll progress
already computed in the rAF loop, so it can be sparse and cold at beat 1 and
warm and full at beat 5.

Roughly half a day including the asset. Do it after the five beats exist —
it is the last 5% and it is meaningless if the beats are wrong.
