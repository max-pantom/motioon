---
name: motion-beats
description: Time overlapping beats and staggers so Motion scenes feel cut, not sequenced like slides. Use when layers arrive in a queue, timing is even, or the user asks for overlap, stagger, or rhythm.
---

# Beats

A beat is an event on the tape — a cut, a rise start, a click, a word on. Overlap them on purpose.

## Overlap

The next enter may start before the current hold ends. That is how launch films breathe.

```text
card A  rise 0.32 then hold
        at 70% of A's hold, cut or rise B
```

Do not wait for A to fade out unless A is covering B.

## Stagger

If two supporting layers must arrive:

```text
0.00  primary   rise
0.08  secondary cut
0.16  tertiary  cut   — or skip tertiary
```

At 24fps, 0 / 2f / 4f is a subtle 83ms stagger. Use the frame units supported
by `motion.md`, and check the total scene duration before offsetting.

## One mover

Only one layer is *moving* at a time. Others may be on and still. If two rises overlap, offset them or cut the second.

## Map to sound

Cuts and rise-starts are mix cues. After you lock beats, `motion-sound` expands `at: cuts` and `at: rises`.
