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
