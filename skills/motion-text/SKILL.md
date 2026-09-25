---
name: motion-text
description: Write and set type for Motion videos. Use when headlines, captions, line breaks, roles, or typography look cheap or stacked. Triggers include text, type, headline, caption, copy, font, kerning.
---

# Text

Type is the picture unless a UI tape is on screen.

## Roles

- `hero` — one designed sentence. Huge. Left seat.
- `sub` — only if the hero cannot carry the turn. Footer seat.
- `label` — tracked small. Product name, date, or NEW. Never a slogan.
- `caption` — UI tape only. One line.

Two sizes on screen at once. Not three.

## Breaks

You write the breaks. A newline is a cut inside the card.

Bad: `Your calendar, finally.` as one wrap.
Good: `Your calendar,` / `finally.`

No orphans. No mid-word scale tricks.

## Motion on type

Default enter for hero in `openai-launch` is `rise` (fade + 0.96→1).
Do not `fade-up` type. Do not blur type. Do not bounce type.

Supporting lines may `cut` on.

## Voice

Short. Present tense. No “introducing.” No “reimagined.”
If you cannot say it out loud in one breath, split the scene.

Use `font_size`, `max_width`, and explicit line breaks in the structured text
layer. Inspect a frame at the target aspect instead of relying on one fixed
type scale.

For typed interface copy, `typewriter: {cps: 10, from: 0.15, caret: true}`
reveals characters by seekable time. A text layer can follow a timed
`path: [{t, x, y}, ...]`; use `distribution: glyphs` with a Bézier path
behavior when individual letters should sit along the curve.
