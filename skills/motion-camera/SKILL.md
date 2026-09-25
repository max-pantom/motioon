---
name: motion-camera
description: Frame and push the camera in Motion. Use when zoom, punch-in, framing a UI capture, or the shot needs a slow move on the whole scene. Triggers include camera, zoom, punch, push, framing, ken burns, scale the frame.
---

# Camera

Treat the UI image or video layer as the camera plate. Move one plate per shot;
the current structured format supports `move: push` on image and video layers,
and now also supports a scene-level `camera: {type: push, ...}`. Use the latter
when the entire UI scene should respond to the cursor.

## Four zoom tiers

| tier | scale | duration | use |
|---|---|---|---|
| `rest` | 1.00 → 1.00 | — | cards, type, holds |
| `punch` | 1.00 → 1.04 | 2.4–4.0s | UI tape, product still |
| `lean` | 1.00 → 1.08 | 2.0–3.2s | object, poster with a still |
| `push` | 1.00 → 1.12 | 1.6–2.8s | rare. end of a UI beat |
| `crash` | 1.00 → 1.20 | ≤ 1.2s | almost never. smash cut into a detail |

Write the supported layer motion:

```yaml
- id: product
  type: video
  src: asset:ui.feature
  move: push
  from: 1.0
  to: 1.04
  x: 50%
  y: 46%
```

Anchor toward the thing that matters (the cursor, the input, the face of the UI). Dead center punch looks like a Ken Burns default.

For a scene-wide push with restrained cursor intent:

```yaml
camera: {type: push, from: 1, to: 1.04, follow: cursor, strength: 0.06, lag: 120ms}
```

Without a cursor, choose the optical center explicitly with
`camera: {from: 1, to: 1.04, anchor: [52%, 48%]}`.

## Framing while zoomed

Zoom reveals crop. Start wider than you think. Keep 8% margin *after* the end scale.

UI tape — letterbox first, then `punch`. Do not punch a full-bleed dashboard.

## Forbidden

- A zoom on every scene
- Mixing tier `push` with layer `fade-up`
- Punching type cards
- Crash zoom on words

Check the first and last frame with `motioon inspect` so the push does not
crop the action.
