---
version: 1
title: It's live — eight seconds
width: 1920
height: 1080
fps: 24
duration: 8
background: "#F9F8F4"
catalog: ./assets/catalog.json
theme:
  text: "#111111"
  muted: "#737373"
  accent: "#111111"
  font_display: "Helvetica Neue, Arial, ui-sans-serif"
  font_body: "Helvetica Neue, Arial, ui-sans-serif"
audio:
  master: {lufs: -16, peak: -1.5, sample_rate: 48000}
  tracks:
    - {id: point, kind: sting, src: "asset:tick.point", at: 0, gain_db: -18, oneshot: true}
    - {id: cuts, kind: sting, src: "asset:tick.cut", at: cuts, gain_db: -18, oneshot: true}
    - {id: click, kind: sting, src: "asset:tick.point", at: "event:field-click", gain_db: -20, oneshot: true}
---

# Direction

Paper field, a single word, a flat panel that sits in space, one interaction,
then a held name. The cursor, typing and camera are sought from time.

## scene: word
```motion
kind: card
duration: 1.6
transition: cut
elements:
  - id: point
    type: shape
    shape: circle
    x: 18%
    y: 28%
    w: 12
    h: 12
    fill: "#111111"
    duration: 0.5
    enter: fade-blur 0.35
    exit: fade 0.12
  - id: live
    type: text
    text: LIVE
    x: 18%
    y: 28%
    w: 560
    font_size: 132
    font_weight: 600
    color: "#111111"
    enter: fade-blur 0.55 0.28
    path:
      - {t: 0, x: 12%, y: 38%}
      - {t: 1.1, x: 18%, y: 28%, ease: expo-out}
```

## scene: panel
```motion
kind: ui
duration: 4.2
transition: cut
camera: {from: 1, to: 1.04, duration: 2.4, anchor: [52%, 48%]}
cursor:
  path:
    - {t: 0, x: 74%, y: 75%}
    - {t: 0.6, x: 52%, y: 51%, ease: expo-out, click: true, event: field-click}
    - {t: 1.9, x: 110%, y: 80%, ease: expo-out}
elements:
  - id: panel-body
    type: group
    enter: tilt-in 0.55
    keyframes:
      rotateY:
        - {t: 0, v: -16}
        - {t: 1.1, v: 0, ease: linear}
      rotateX:
        - {t: 0, v: 4}
        - {t: 1.1, v: 0, ease: linear}
    children:
      - id: paper
        type: shape
        shape: rect
        x: 50%
        y: 48%
        w: 1180
        h: 650
        fill: "#FFFFFF"
        radius: 28
        shadow: "0 35px 110px rgba(0,0,0,.16)"
      - id: eyebrow
        type: text
        text: YOUR NEXT MOVE
        x: 36%
        y: 29%
        w: 460
        font_size: 20
        font_weight: 600
        letter_spacing: 3
        color: "#737373"
      - id: prompt
        type: text
        text: What are we making?
        x: 50%
        y: 40%
        w: 900
        font_size: 62
        font_weight: 500
        color: "#111111"
      - id: input-well
        type: shape
        shape: rect
        x: 50%
        y: 55%
        w: 860
        h: 112
        fill: "#F4F4F0"
        radius: 14
      - id: typed
        type: text
        text: Q4 plan
        x: 40%
        y: 55%
        w: 400
        font_size: 40
        text_align: left
        color: "#111111"
        typewriter: {cps: 10, from: 0.7, caret: true}
```

## scene: hold
```motion
kind: card
duration: 2.2
transition: cut
elements:
  - id: live-last
    type: text
    text: LIVE.
    x: 50%
    y: 44%
    w: 900
    font_size: 130
    font_weight: 600
    color: "#111111"
  - id: motion-last
    type: text
    text: MOTION
    x: 50%
    y: 58%
    w: 900
    font_size: 36
    font_weight: 500
    letter_spacing: 10
    color: "#737373"
```
