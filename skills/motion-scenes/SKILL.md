---
name: motion-scenes
description: Cut and time scenes in motion.md. Use when scene length, holds, transitions, or the tape feels even and generic. Triggers include scenes, cuts, hold, pacing, duration, transition.
---

# Scenes

A scene is a shot. Give it a reason to exist and a hold.

## Math

- Start = end of previous unless `at` is set.
- Hold = duration minus enter. Hold must be felt.
- Median hold across the piece ≥ 1.6s.
- Give the last scene enough time to read. Around 1.4–2.4s suits most short
  launch clips; the exact end hold follows the shot, not a fixed minimum.
- Do not trisect the tape.

## Transitions

Default `cut`.
Use a short `fade` only when a cut would pop a still photograph.
No dissolve between two cards of type.

## Pattern for launch

```text
point   0.8–1.4s
card    1.6–3.0s
ui      2.4–4.0s
card    1.6–2.4s
hold    1.6–2.4s
```

## One idea

If you need two sentences, you need two scenes or a designed line break — not a second text layer arriving mid-hold.

## Handoff

Moves live in `motion-presets` and `motion-camera`. Scenes only decide when the tape changes.
