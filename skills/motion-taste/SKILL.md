---
name: motion-taste
description: Apply Motion taste recipes so output is not generic SaaS. Use when the clip looks cheap, the user names openai-launch, poster, object, or board, or after a first pass that used fade-up and centered stacks.
---

# Taste

Pick a recipe only when it serves the brief. `openai-launch` is the currently
implemented scored recipe; the other modes below are craft directions, not
values accepted by the `recipe:` field.

## openai-launch

- Cards use white or ink ground, `#111` ink, and a restrained muted color.
  Product/UI inserts may carry their real interface palette, including accent
  colors. The reference sheets in `references/openai-launch/` show the range.
- One grotesque, weight 400–500.
- Enter `rise` or `cut`. No `fade-up` on type. A brief focus blur is suitable
  when it is tied to a specific click or reveal, not as the default for cards.
- One entrance per scene. Median hold ≥ 1.6s.
- Leave cards still. If a UI insert needs motion, use a single subtle
  `move: push` on its image or video layer.
- Sound — ticks on cuts and rises. No whoosh. Bed only if asked, ≤ −22 dB.

## poster

- Giant type, designed breaks, paper or ink ground.
- One move in the whole piece.

## object

- One image, hard crop, one caption in a seat.

## board

- Black, three lines, `mask-up`, no product shot.

## Fail the pass if

- hero + sub + label centered
- same enter on every layer
- equal scene lengths
- a generic violet-on-ink SaaS hero that ignores the brief or references
- more than four things visible

If the user attached launch refs, treat them as evidence for this recipe, not as plots to copy.
