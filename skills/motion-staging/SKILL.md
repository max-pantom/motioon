---
name: motion-staging
description: Place layers in the frame. Use when layout, framing, letterboxing, overlap, or where type sits is the problem. Triggers include staging, layout, composition, framing, letterbox, safe area, grid.
---

# Staging

Nothing defaults to 50% / 50% except a lone point.

## Grid

Treat the frame as margins + two seats.

- Margin 8% on all sides (6% on 9:16).
- Type seat — left 10–12%, y 18% (title) or y 78% (footer line).
- Object seat — right 62–88% or full letterbox 8% inset.
- Point seat — dead center only for the opening pulse.

Inspect the start and end of any zoom or crop with `motioon inspect`.

## Roles

| role | x | y | align |
|---|---|---|---|
| hero | 12% | 22% | left |
| sub | 12% | 78% | left |
| label | 12% | 14% | left |
| footer | 12% | 88% | left |
| ui | 50% | 48% | center, width 82% |
| point | 50% | 50% | center |

Never stack hero + sub + label in the middle.

## Overlap

Allowed. Type may sit on a quiet plate of the UI. Do not cover the action.

Letterbox UI on ground (white or ink). Do not full-bleed a dense dashboard unless the capture was designed for it.

## Safe

- 9:16 — keep type out of the bottom 80px and top 60px (UI chrome).
- Captions live in the footer seat, not on the product.

## Check

If every layer is centered, staging failed. Move type to a seat before you animate.
