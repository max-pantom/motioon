---
name: motion-storyboard
description: Turn a story spine into a shot list before writing motion.md. Use when storyboarding, planning shots, listing beats, or the user says board it out. Triggers include storyboard, shot list, beats, sequence, animatic.
---

# Storyboard

Output a board, not HTML. Each shot is one row.

```text
#  t     kind     copy / asset              move          sound
1  0.00  point    —                         pulse         tick.point
2  1.20  card     LATE                      cut           tick.cut
3  2.40  card     ON TIME                   rise          tick.arrive
4  5.00  ui       asset:ui.feature          push          —
5  7.20  card     MOTION                    cut           tick.cut
6  8.00  hold     —                         none          silence
```

## Shot kinds

`point` `card` `ui` `object` `hold` `title` `cursor`

Kind decides staging. Do not put UI chrome on a `card`. Do not put a paragraph on `ui`.

## Rules

- Write times first. Median hold ≥ 1.6s.
- Prefer intentional, uneven holds over mechanical equal spacing.
- One move per shot. `none` is a valid move.
- Name catalog assets now. If `ui.feature` does not exist, go to `motion-setup` and capture it. Do not board a fake phone.
- Max 8 shots for a first pass.

## Handoff

When the board is agreed, write `motion.md` with one scene per shot (or per pair of cards). Load `motion-scenes`, `motion-staging`, `motion-text`.
