---
name: motion-presets
description: Pick enter, exit, easing, and spring presets for Motion layers. Use when animation feels generic, bouncy, or every layer uses fade-up. Triggers include preset, easing, spring, rise, ease, enter, exit.
---

# Presets

Presets compile to seekable motion. Do not invent a new curve per layer.
For coordinated micro motion, put `behaviors:` on the existing layer. The
runtime currently supports `blur`, `mask`, `depth`, `path`, and `compress`;
these compose with an entrance rather than creating new layer types. Start
them with `on: event-id` when sound and cursor must land on the same frame.

## Enter (picture)

| preset | what | default dur | use on |
|---|---|---|---|
| `none` | pop on | 0 | supporting type, holds |
| `rise` | fade + scale 0.96→1 | 0.32 | hero type, openai recipe |
| `fade` | opacity only | 0.24 | overlays, plates |
| `reveal` | top-down clip reveal | 0.45 | editorial headline |
| `slide-left` / `slide-right` | horizontal travel | 0.32 | UI chrome only |
| `scale-fade` | scale 0.92→1 + fade | 0.40 | plates, not type |
| `fade-blur` | focus and opacity together | 0.55 | one emphasized word |
| `tilt-in` | pseudo-3D panel settles | 0.55 | one product plate |

Avoid `fade-up` and `bounce` on type. Use blur on one deliberate focus beat,
not on every card.

## Exit

Shorter than enter. `cut` or `fade` 0.12–0.18. Ease-in.

## Easing

| token | curve | use |
|---|---|---|
| `expo.out` | exponential ease out | rise, most enters |
| `ease-in` | cubic-bezier(0.4, 0, 1, 1) | exits |
| `linear` | linear | wipes, camera punch over long holds |
| `spring.soft` | damped spring | UI chrome, cursor settle |
| `spring.snappy` | quicker spring | clicks, toggles |

Use one easing family per piece. Check a settled frame before the next cut;
avoid springs on type in `openai-launch`.
