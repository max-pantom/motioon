---
version: 1
title: Motioon — make motion editable
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
audio:
  master: {lufs: -16, peak: -1.5, sample_rate: 48000}
  tracks:
    - {id: point, kind: sting, src: "asset:tick.point", at: 0, gain_db: -17, oneshot: true}
    - {id: cuts, kind: sting, src: "asset:tick.cut", at: cuts, gain_db: -18, oneshot: true}
---

# Direction

Use sparse cards around a real capture of Motioon Studio. The interface is the
proof. Hold each beat, use hard cuts, and leave silence between dry ticks.

## scene: point
```motion
kind: card
duration: 1.2
transition: cut
elements:
  - id: point
    type: shape
    shape: circle
    x: 50%
    y: 50%
    w: 16
    h: 16
    fill: "#111111"
```

## scene: promise
```motion
kind: card
duration: 2.8
transition: cut
elements:
  - id: promise
    type: text
    text: Make motion editable.
    x: 49%
    y: 49%
    w: 1320
    font_size: 72
    font_weight: 500
    letter_spacing: -2
    line_height: 1
    color: "#111111"
    enter: {preset: rise, duration: 0.32, easing: "cubic-bezier(0.16, 1, 0.3, 1)"}
```

## scene: product
```motion
kind: ui
duration: 2.6
transition: cut
elements:
  - id: studio-ui
    type: image
    src: "asset:ui.feature"
    x: 50%
    y: 50%
    w: 1560
    h: 975
    fit: contain
    move: push
    from: 1
    to: 1.04
```

## scene: name
```motion
kind: card
duration: 1.4
transition: cut
elements:
  - id: name
    type: text
    text: motioon
    x: 50%
    y: 50%
    w: 800
    font_size: 88
    font_weight: 500
    letter_spacing: -3
    color: "#111111"
```
