---
version: 1
title: Motioon — micro motion
recipe: openai-launch
width: 1920
height: 1080
fps: 24
duration: 8
background: "#FFFFFF"
catalog: ./assets/catalog.json
theme:
  text: "#111111"
  muted: "#8E8EA0"
  accent: "#111111"
  font_display: "Helvetica Neue, Arial, ui-sans-serif"
  font_body: "Helvetica Neue, Arial, ui-sans-serif"
paths:
  arc:
    type: bezier
    points: [[410, 800], [770, 640], [1180, 720], [1510, 660]]
audio:
  master: {lufs: -16, peak: -1.5, sample_rate: 48000}
  tracks:
    - {id: point, kind: sting, src: "asset:tick.point", at: 0, gain_db: -17, oneshot: true}
    - {id: cuts, kind: sting, src: "asset:tick.cut", at: cuts, gain_db: -18, oneshot: true}
    - {id: select, kind: sting, src: "asset:tick.point", at: "event:select", gain_db: -19, oneshot: true}
---

# Direction

The screenshot is a real Motioon Studio capture. This fixture tests how a
cursor, event, mask, focus, depth, path and camera movement share one timeline.
The last card holds still and has no audio cue after 6.55 seconds.

## scene: approach
```motion
kind: card
duration: 1.1
transition: cut
cursor:
  x: 90%
  y: 90%
  actions:
    - {type: move, at: 0.08, to: [50%, 50%], duration: 0.84, easing: expo.out}
```

## scene: invitation
```motion
kind: card
duration: 1.4
transition: cut
cursor:
  x: 50%
  y: 50%
  actions:
    - {type: click, at: 0, duration: 0.18, event: open}
elements:
  - id: invitation
    type: text
    text: Make something.
    x: 50%
    y: 50%
    w: 1100
    font_size: 76
    font_weight: 500
    color: "#111111"
    behaviors:
      - {type: mask, shape: circle, origin: cursor, from: 0, to: 140, duration: 0.44, on: open}
      - {type: blur, from: 18, to: 0, duration: 0.38, on: open}
```

## scene: product
```motion
kind: ui
duration: 2.2
transition: cut
camera: {type: push, from: 1, to: 1.04, follow: cursor, strength: 0.06, lag: 0.12}
cursor:
  x: 29%
  y: 62%
  actions:
    - {type: move, at: 0.26, to: [67%, 59%], duration: 1.26, easing: expo.out}
    - {type: click, at: 1.78, duration: 0.18, event: select}
elements:
  - id: interface
    type: image
    src: asset:ui.feature
    fit: contain
    x: 50%
    y: 50%
    w: 1420
    h: 890
    behaviors:
      - {type: depth, perspective: 1200, tilt_x: -1, tilt_y: 1, react: cursor, strength: 1.1}
      - {type: compress, on: select, scale: 0.985, duration: 0.18, easing: spring.snappy}
```

## scene: lift
```motion
kind: ui
duration: 1.85
transition: cut
events:
  lift: 0
elements:
  - id: soft-interface
    type: image
    src: asset:ui.feature
    x: 50%
    y: 50%
    w: 1420
    h: 890
    behaviors:
      - {type: blur, from: 0, to: 12, duration: 0.42, on: lift}
  - id: lifted-card
    type: shape
    shape: rect
    x: 50%
    y: 43%
    w: 590
    h: 340
    fill: "#FFFFFF"
    radius: 20
    shadow: "0 24px 80px rgba(0,0,0,.16)"
    behaviors:
      - {type: depth, perspective: 1100, tilt_x: -4, tilt_y: 4, float_y: 8, period: 3.2}
  - id: card-title
    type: text
    text: Build it. Ship it.
    x: 50%
    y: 42%
    w: 500
    font_size: 40
    color: "#111111"
  - id: curved-type
    type: text
    text: SELL WHAT YOU BUILD
    x: 50%
    y: 70%
    w: 760
    h: 80
    font_size: 22
    color: "#111111"
    distribution: glyphs
    spacing: 0.035
    behaviors:
      - {type: path, path: arc, from: 0, to: 1, duration: 1.5, easing: expo.out, orient: tangent}
```

## scene: name
```motion
kind: card
duration: 1.45
transition: cut
elements:
  - id: wordmark
    type: text
    text: motioon
    x: 50%
    y: 46%
    font_size: 88
    font_weight: 600
    color: "#111111"
  - id: tagline
    type: text
    text: Make motion editable.
    x: 50%
    y: 58%
    font_size: 28
    color: "#8E8EA0"
```
