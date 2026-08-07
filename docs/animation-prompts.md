# Process animation — image generation prompts

Working log for the scroll-story animation that replaces the placeholder
footage in the `process` section (closes O-14).

The **v1–v5 prompts** below are for beat 1 (the "before" state), kept as a
version log. The **six locked beats and their prompts** start further down.

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
  Handwriting cannot scale to "wall to wall booked" at beat 4, and cannot
  change colour to show the price rise at beat 5.
- **Blocks are FLAT TAN through beat 4 and DEEP SATURATED GOLD from beat 5.**
  Gold is the only signal that the price changed, so it must not appear one
  frame early. Beat 3 came back with gold blocks in it and had to be redone.
- **Calendar on the right, piggy bank on the left.** RTL reading order: how
  full is she first, what it is worth second.
- **The storefront must be wide enough to hold three or four people standing
  outside looking in.** Needed at beat 6. Cheap now, a redraw later.
- **The room never upgrades.** Same furniture, same camera, same positions in
  all six beats. What changes is her posture, who is in the room, the light,
  the calendar and the piggy bank. Nothing else.
- **Every frame is exactly 1536×2752.** Video interpolation needs pixel-identical
  canvases. Generations drift — a beat 2 candidate came back 1536×2784, and
  beats 3 and 4 came back **1600×2642**, which is a different *aspect ratio*
  (1.65 vs 1.79), not just a different size. Check dimensions on every accepted
  frame. **Fix by padding the top with matching near-black, never by cropping
  the width** — the top zone is deliberately empty so extending it is free,
  where cropping eats into the piggy bank and calendar at the edges.
- **Nobody ever looks at the calendar or the piggy bank.** They are graphic
  devices floating outside the room's space, not objects the characters can see.
  Both sit at the bottom of the frame, so directing a character to look at one
  makes them look *down* — and two women standing still looking down reads as
  grief. This is what wrecked the first beat 5.

## Production rule

Once beat 1 is locked, **stop prompting from scratch.** Each beat is an edit of
the beat before it, changing only what that beat changes. Fresh generations
drift the furniture and the scrub will look like six different salons instead
of one room over time.

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

# The six beats

The story, from `pain` and `method`: she is a professional nobody knows about;
she becomes visible; it starts working; it works too well at the wrong price;
she raises it and holds her nerve; she ends up with fewer hours and more money.

| Beat | Room | Calendar | Piggy |
| --- | --- | --- | --- |
| 1 | Empty chair, alone, silent phone | 4 tan | ~8% |
| 2 | Filming, Eliya guiding | 4 tan — **unchanged** | ~8% — **unchanged** |
| 3 | First clients. One in the chair, Eliya present | ~12 tan | ~20% |
| 4 | Packed. Four clients, hectic, Eliya at the wall | ~30 tan, nearly full | ~45% |
| 5 | Price raised. One client, she checks her phone, Eliya beside her | ~10, some **gold**, obvious holes | ~45% — **unchanged** |
| 6 | Calm, daylight, crowd outside, Eliya applauding | ~14 all **gold**, big gaps | ~85%, glowing |

**The phone rhyme.** Beat 1 is her staring at a silent phone in despair; beat 5
is her staring at the same phone in suspense — *did anyone book at the new
price?* Same gesture, opposite meaning, across the whole arc.

## The three things that carry the argument

**Beat 2 pays off nothing.** Calendar and piggy bank do not move. She does the
work and gets nothing yet. That honesty is what makes beat 3 land.

**Beat 5's piggy bank does not move either.** This is the most important frame
in the sequence and the easiest to get wrong. The calendar collapses from ~30
blocks to ~10 and the money stays exactly where it was. A third of the work,
identical income — there is no other explanation for that, and the viewer does
the arithmetic without being told. It is also her own promise word for word:
`method.pricing` says **לעבוד פחות שעות על אותה הכנסה**.

**The piggy levels must be arithmetically honest.** At a constant price the
money scales with bookings, which is why beat 3 is ~20% and beat 4 ~45%. The
whole argument lives in the two places where that proportionality *breaks*:

- **4 → 5:** bookings collapse, money holds. Only a price rise explains it.
- **4 → 6:** half the bookings, roughly double the money. That is נ.ש's
  testimonial exactly — *מרוויחה פי 2 בפחות שעות*.

If beat 4's piggy is too high the packed month looks fine and there is no
reason to change anything. If it is too low the arithmetic stops working.

**Time of day:** interior lighting is constant in all six. Only what is visible
*through the glass* changes — night for beats 1 to 5 (still working late, which
is the point at beat 4), golden late afternoon at beat 6. That carries "she no
longer works nights" without relighting the room, and keeps the change local
for the interpolation.

**Wardrobe and camera never change.** Same cream top, same dark trousers, same
angle, same furniture in the same places, all six beats.

## Eliya is in the room, beats 2 to 5

Daniel's decision. She is physically present, not a call on a screen.

**Absent at beat 1, present at beats 2 to 6.** One entrance, no exit. She
appears when the help starts and stays to the end.

Her being present at beat 4 makes beat 5 causal rather than arbitrary: she is
standing there watching the woman drown in cheap appointments, which is *why*
the price goes up in the next frame.

**Revised 2026-08-08 (Daniel).** She was originally gone at beat 6 — *the coach
leaves and the business remains* — which made the last frame the viewer's own
victory rather than a shared one. Daniel wanted her celebrating instead. The
trade is real: her presence reads slightly more like "you will always need her,"
but it is warmer, and on a page whose CTA is *book a call with me* a delighted
coach in the final frame is the better commercial choice. It also removes the
hardest transition in the sequence — her exit across the night-to-daylight jump.

**She is visiting, not working, at beat 6.** Standing back, applauding, away
from the treatment chair. The studio owner is centre frame and the larger
figure. Shared joy, but the room is unmistakably hers.

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

### Likeness — attach the photo, but recognition comes from silhouette

**Attach `assets/portrait/eliya-phone-blazer.jpg` to every generation that
contains her.** The full-resolution original, not a screenshot. It is the same
photo already used elsewhere on the page, which is the whole point.

**The face will not be recognisable and that is fine.** In the locked frame the
studio owner's head is about 75px in a 2752px-tall render — roughly 15 pixels
on a 390px phone viewport. There is no face at that scale, for anyone. The
style is flat editorial illustration where a face is three or four simplified
shapes, and that is why it looks good.

What survives stylisation and small scale, and what to actually ask for:

- The **oversized boxy double-breasted black blazer** with wide lapels. A
  strong, unusual silhouette that reads long after facial detail is gone.
- The **long dark hair**, centre-parted, swept back on one side with a heavy
  wave falling forward over one shoulder.

Recognition then happens by **rhyme, not by portraiture**: a visitor who
scrolled past that photograph and then sees an illustrated woman in the same
blazer with the same hair makes the connection immediately.

⚠️ **The failure mode is succeeding too hard.** Feeding a photograph to an image
model drags realism in with it. A semi-realistic detailed face among figures
made of four flat shapes looks far worse than a generic figure, and reads as a
mistake rather than as her. Every prompt containing her must cap it explicitly:
same level of simplification as every other figure, no extra detail, no
photographic rendering.

Making her face genuinely readable would require her to be large in frame,
which contradicts the rule holding the whole piece together — she is never
centre frame, because the story is the viewer's business and not Eliya's. Not
worth the trade.

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

A SECOND WOMAN is now in the room, off to one side: her coach. Match
her to the attached reference photograph — her colouring, her long dark
hair centre-parted and swept back with a heavy wave falling forward
over one shoulder, and her oversized boxy double-breasted BLACK BLAZER
with wide lapels over a black top. The blazer and the hair are what
matter; she must be instantly distinguishable from the studio owner in
her cream top.

Render her in EXACTLY the same flat illustrated style and at exactly
the same level of simplification as every other figure in the picture.
Do not give her a more detailed, more realistic or more photographic
face than the others. Do not shift the illustration style towards
photography.

She is standing beside the tripod, one hand raised mid-gesture,
directing and encouraging her. She is not touching anything and not
working. She is clearly the helper, not the subject.

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

### Beat 2 variant — FACE TEST

One-off experiment: push for an actual facial likeness instead of relying on
silhouette. Run this alongside the standard beat 2 and compare. Edit from
**beat 1**, with `assets/portrait/eliya-phone-blazer.jpg` attached.

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

A SECOND WOMAN is now in the room, off to one side: her coach. She is
the woman in the attached reference photograph and her FACE MUST BE
RECOGNISABLY HERS. Reproduce her actual features as faithfully as the
illustration style allows: oval face with high cheekbones, warm olive
skin, strong well-defined dark eyebrows, dark brown eyes, a straight
nose, full lips. Her long dark hair is centre-parted and swept back,
with a heavy wave falling forward over one shoulder. She wears the same
oversized boxy double-breasted black blazer with wide lapels over a
black top.

Her face may carry more detail and definition than the other figures in
the scene if that is what it takes to make her recognisable. Keep the
rendering illustrated rather than photographic, but prioritise the
likeness.

She is standing beside the tripod, one hand raised mid-gesture,
directing and encouraging her. She is not touching anything and not
working. She remains off to one side and the studio owner stays the
centre of the picture.

A cool white pool of light from the ring light falls on the STUDIO
OWNER. The coach stands outside that pool in the warmer room light.

EVERYTHING ELSE IS IDENTICAL. The treatment chair is still empty. The
waiting bench is still empty. The street outside is still dark and
empty with nobody passing. The calendar still has exactly the same four
small beige blocks in the same cells, unchanged. The piggy bank still
has exactly the same few notes lying in the bottom of its belly,
unchanged. No text anywhere.
```

**How to judge it — two tests, both required:**

1. **Scale it down to about 390px wide** and look again. That is the phone
   viewport, and it is the only size that matters. A likeness that only works
   at full resolution has not worked.
2. **Does she look like she belongs?** A face with more definition than
   everyone else reads as pasted in. If she looks like a different illustration
   standing in the room, the test has failed even if it looks like her.

⚠️ **If it passes, it has a cost.** A detailed face on Eliya makes the studio
owner's blank simplified face look wrong beside her — so the detail level would
have to come up across *all* figures, in all five beats, which means re-locking
beat 1. Decide whether the likeness is worth that before falling in love with
the result.

**Optional diagnostic.** If the face comes out illegible but well drawn, the
limit is scale, not the model. To confirm, generate one throwaway frame with
the camera much closer on her. If the likeness works there and not at
production scale, the only fix is making her large in frame — which contradicts
her never being the subject, and is the trade to refuse.

### Beat 2 — LOCKED

`Gemini_Generated_Image_dkks7mdkks7mdkks.png` — generated from the FACE TEST
variant, with the screenshot of `eliya-phone-blazer.jpg` attached as reference.

**The face test resolved in favour of keeping the likeness.** At full resolution
she reads as Eliya; at phone scale she reads as "dark-haired woman in a black
blazer," exactly as predicted. Crucially the model did **not** over-detail her —
both faces sit at the same level of simplification, so she does not look pasted
in. That means no cascade: beat 1 stays locked and the other figures do not need
re-rendering.

Why this candidate over `Gemini_Generated_Image_fkg0uhfkg0uhfkg0.png`: she is
centred inside the ring and clearly being filmed rather than standing beside the
rig; the hierarchy is right (she is the brightest thing, Eliya is secondary in
warm light off to the side); the treatment chair is back in its beat 1 position;
and the canvas is 1536×2752, matching beat 1, where the other candidate came
back 1536×2784.

Both critical invariants survived the edit: calendar blocks in the same four
cells, piggy bank at the same level.

**Known minor drift, accepted:** her trousers read grey-blue here against black
in beat 1, and her posture is stiff. Both are invisible at phone scale and under
the page's dark wash. Not worth re-rolling — another generation risks the
calendar cells, the piggy level and the canvas size, all of which are currently
correct.

⚠️ For the 2 → 3 transition: the ring light is now centre-frame on a tall
tripod and has to move back to the side and switch off. That is the largest
object move in the sequence — check it when the video is interpolated.

## Beat 3 — first clients

Edit from **beat 2**. Attach `assets/portrait/eliya-phone-blazer.jpg`.

Superseded candidate: `Gemini_Generated_Image_t9iguvt9iguvt9ig.png` — right
composition, but it came back with three bright **gold** blocks in the calendar.
Gold cannot appear before the price rise at beat 5 or the hinge of the whole
story is spent early. Regenerate with the prompt below.

```
Using this image, keep the room, the camera angle, the furniture, the
lighting and the woman's clothing exactly as they are. Change only the
following:

She is no longer filming. The ring light is switched OFF, dark, and
stays where it is on its tripod. Her phone is off the tripod.

A client is now lying in the treatment chair, relaxed, being worked on.
The woman who owns the studio, in the cream top, is standing beside the
chair working on her, calm and focused. The waiting bench is still
empty.

The coach in the black blazer is standing off to one side, a little
back, watching and quietly pleased. Not touching anyone, not working.

The calendar has filled up somewhat: about TWELVE blocks now, scattered
across the grid, with more than half of the cells still empty. EVERY
block is the same FLAT PALE TAN as before. There is NO gold, NO amber
and NO bright block anywhere in the calendar.

The piggy bank has risen a little — banknotes now filling roughly the
bottom fifth of its belly. Still clearly low.

EVERYTHING ELSE IS IDENTICAL. Same room, same angle, same furniture in
the same places. The street outside is still dark and it is still
night. No text anywhere.
```

## Beat 4 — packed, and it is the wrong kind of full

Edit from **beat 3**. Attach the portrait reference.

Superseded candidate: `Gemini_Generated_Image_9dnwlq9dnwlq9dnw.png` — the room
is right, but its piggy bank sat at roughly the same level as beat 3's, which
would say she doubled her workload for nothing. Regenerate with the money
clearly higher.

```
Using this image, keep the room, the camera angle, the furniture, the
lighting and the woman's clothing exactly as they are. Change only the
following:

The studio is crowded and hectic. A client is lying in the treatment
chair being worked on. Two more women are sitting waiting on the bench,
and one more is just coming through the door from the street.

The woman who owns the studio is standing over the treatment chair
working, hurried and tense, hair coming loose, not smiling. She is
visibly overworked rather than unhappy with the clients.

The coach in the black blazer is pushed to the edge of the room,
standing back against the near wall out of the way, arms folded,
watching the chaos. Not helping, not working on anyone. Small in the
frame.

The calendar is now almost completely full: nearly every cell carries a
block. EVERY block is still the same FLAT PALE TAN as before — many
more of them, but no change in colour. There is NO gold and NO amber
anywhere in the calendar.

The piggy bank has risen clearly and is now a little under HALF full,
banknotes filling the lower half of its belly. Noticeably more than the
previous frame.

EVERYTHING ELSE IS IDENTICAL. Same room, same angle, same furniture in
the same places. The street outside is still dark and it is still
night. No text anywhere.
```

## Beat 5 — she raises the price

Edit from **beat 4**. Attach the portrait reference.

**The most important frame in the sequence.** The calendar collapses and the
money does not move. If the piggy bank rises here, the risk looks free and the
beat means nothing.

```
Using this image, keep the room, the camera angle, the furniture, the
lighting and the woman's clothing exactly as they are. Change only the
following:

The studio has emptied out. Only one client remains in the treatment
chair. The waiting bench is empty. Nobody is at the door.

The woman who owns the studio is standing near her desk holding her
PHONE UP in front of her, looking at its screen, waiting to see whether
anyone has booked. Alert and hopeful rather than sad — this is
suspense, not grief. Her head is UP and her eyes are on the phone at
chest height.

The coach in the black blazer stands beside her, calm and reassuring,
looking AT HER rather than into the distance, one hand near her
shoulder. The studio owner stays closest to the centre of the picture.

⚠️ NEITHER WOMAN LOOKS DOWNWARD. Neither woman looks at the calendar or
the piggy bank. Nobody has a sad, mournful or grieving expression. All
eye lines are level or upward.

The calendar has changed character completely. Most of the blocks are
gone, leaving large visibly EMPTY areas in the grid. About TEN blocks
remain, and several of them are now DEEP SATURATED GOLD — an obviously
richer, brighter colour than the flat pale tan of the remaining ones.
The two kinds of block must be distinguishable at a glance.

The piggy bank is at EXACTLY the same level as the previous frame. The
banknotes fill it to precisely the same height. It has NOT risen. Do
not add any money.

EVERYTHING ELSE IS IDENTICAL. Same room, same angle, same furniture in
the same places. The street outside is still dark and it is still
night. No text anywhere.
```

## Beat 6 — fewer hours, more money

Edit from **beat 5**.

```
Using this image, keep the room, the camera angle, the furniture and
the woman's clothing exactly as they are. Change only the following:

Through the storefront glass it is now golden late afternoon instead of
night — warm daylight outside. Three or four women are standing on the
pavement outside the glass, stopped, looking in. They are OUTSIDE, not
inside. The room itself stays calm and uncrowded.

One client is lying in the treatment chair, relaxed, being worked on
unhurried. The waiting bench is empty.

The woman who owns the studio is standing upright beside the chair,
calm and unhurried, SMILING, openly happy. Hair tidy. She is centre
frame and she is the one this is happening to.

The coach in the black blazer is standing further back and to one side,
away from the treatment chair, APPLAUDING — hands together clapping,
beaming, delighted for her. She is visiting to see this, not working:
she is not touching anything and not near the client. The studio owner
remains the centre of the picture and the larger figure.

The calendar now carries about FOURTEEN blocks, and every single one of
them is DEEP SATURATED GOLD. No pale tan blocks remain. They are spread
out with large, unmistakable empty areas between them — at least one
entire row and a clear run of days left completely empty. The emptiness
must be obvious at a glance, not subtle: that white space is the point
of the picture.

The piggy bank is nearly full, banknotes stacked up to its shoulders.
Far more than the previous frame. The BANKNOTES INSIDE now glow warm
gold and cast a soft golden light out through the glass. The vessel
itself stays clear glass — do not turn the piggy bank gold, do not
change what it is made of. Only the money inside glows.

EVERYTHING ELSE IS IDENTICAL. Same room, same angle, same furniture in
the same places, same interior lamps still on. No text anywhere.
```

---

# Drift check before rendering

Chaining each beat from the previous one keeps adjacent frames consistent,
which is what the interpolation needs — but small changes accumulate. Before
committing to video:

1. Put **beat 1 and beat 6 side by side.** The room must be the same room —
   same chair position, same bench, same door, same mirror, same plants. If it
   has drifted, regenerate the tail from an earlier locked frame.
2. Check the **piggy bank and calendar are in identical positions** in all six.
   Their levels are only comparable if they do not move.
3. Check the **two kinds of block are unmistakably different colours**: flat
   pale tan through beat 4, deep saturated gold from beat 5. If they look alike,
   the price rise is invisible and beats 5 and 6 mean nothing.
4. Put **beats 4 and 5 side by side and check the piggy bank has not moved.**
   This is the one the model will get wrong, because "she raised her price"
   reads to it as "add money."
5. Check **no gold appears before beat 5.** One beat 3 candidate arrived with
   gold blocks already in it.
6. **Count the blocks in beats 4, 5 and 6 and check the shape is 30 → 10 → 14,
   not a straight decline.** The first pass came back 30 → 20 → 11: beat 5
   barely thinned and beat 6 ended up *below* it, which turns a dip-and-recover
   into a monotonic shrink. The model resists non-monotonic change and will
   keep continuing whatever direction the previous edit went in, so this needs
   checking every time.
7. **Check the piggy LEVEL rises at beat 6, not just its glow.** The first pass
   added the gold light but left the notes at beat 5's height, which says
   "fewer clients, same money, but prettier." The level is the instrument; the
   glow is decoration.

## Counting the instruments

The rooms are the easy part and they distract from the checks that matter. When
judging any frame, ignore the room first and read only these two:

| Beat | Blocks | Piggy |
| --- | --- | --- |
| 1 | 4 tan | ~8% |
| 2 | 4 tan | ~8% |
| 3 | ~12 tan | ~20% |
| 4 | ~30 tan | ~45% |
| 5 | **~10**, ~4 gold, most cells EMPTY | ~45% (identical to 4) |
| 6 | ~14, **all** gold, one row empty | ~85% |

---

# Video pipeline

Six stills become five transitions, generated as first-frame / last-frame
interpolations (1 → 2, 2 → 3, 3 → 4, 4 → 5, 5 → 6), then concatenated into one
clip that the scrub seeks through.

Constraints the clip must satisfy, because it is scrubbed rather than played:

- **No camera movement and no cuts.** One fixed frame throughout. A scroller
  can stop anywhere, including mid-transition.
- **No motion blur or fast whips.** Every intermediate frame has to look right
  held still, not just the six beats.
- **Each beat must hold.** The copy rail moves between 34% and 66% of each
  interval, so the picture should rest at each state and do its changing in the
  middle third of each segment.
- Equal-length segments, unless the beat weighting change goes in — see below.

Transitions to watch:

- **2 → 3** — the ring light is centre-frame on a tall tripod in beat 2 and has
  to switch off. Largest single object change in the sequence.
- **5 → 6** — night to golden afternoon, and Eliya exits. The biggest jump, but
  the time change is what licences her absence.

Two open implementation items:

- **Beat weighting.** Beats 4 and 5 deserve more scroll than 1 and 2. That
  needs a code change, not a longer segment: video time and copy position must
  both derive from one weighted position value, or the picture desyncs from the
  words. Currently the seek uses raw progress and the rail assumes equal
  intervals.
- **Six beats, not four.** `process-scrub.tsx` has `STATIONS = 4` and the copy
  rail is `width: 400%` translating by `-position * 100 / 4`. Both need to
  become six (`width: 600%`, `/ 6`), along with six steps of copy in
  `site-content.ts`.

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
