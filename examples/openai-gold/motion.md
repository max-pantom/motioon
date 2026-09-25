---
version: 1
id: openai-gold
title: A quieter way to move ideas
recipe: openai
aspect: "16:9"
fps: 30
duration: 8
background: "#0D0D0D"
safe_area: 96
theme:
  text: "#FFFFFF"
  muted: "#8E8EA0"
  accent: "#FFFFFF"
  font_display: "Helvetica Neue, Arial, ui-sans-serif"
  font_body: "Helvetica Neue, Arial, ui-sans-serif"
assets:
  point_sound: ./audio/point.wav
  arrive_sound: ./audio/arrive.wav
audio:
  master:
    lufs: -16
    peak: -1.5
    sample_rate: 48000
  tracks:
    - id: point
      kind: sting
      src: asset:point_sound
      at: [0, 6.6]
      gain_db: -16
      oneshot: true
    - id: arrive
      kind: sting
      src: asset:arrive_sound
      at: [1.2, 4.0]
      gain_db: -18
      oneshot: true
---

# Creative direction

An eight-second reference clip for Motioon's OpenAI recipe. The film uses a
single point, two left-set statements, hard cuts, long holds, and only four
small sound cues. It must read clearly when muted and feel intentional through
headphones.

## scene: point-open
```motion
duration: 1.2
transition: cut
elements:
  - id: opening-point
    type: shape
    shape: circle
    x: 50%
    y: 50%
    w: 16
    h: 16
    fill: "#FFFFFF"
    at: 0
    duration: 1.2
    animate:
      scale: {from: 1, to: 1.08, start: 0.18, duration: 0.82, easing: "cubic-bezier(0.16, 1, 0.3, 1)"}
```

## scene: first-thought
```motion
duration: 2.8
transition: cut
elements:
  - id: first-point
    type: shape
    shape: circle
    x: 14%
    y: 53%
    w: 12
    h: 12
    fill: "#FFFFFF"
    at: 0
    duration: 2.8
  - id: first-line
    type: text
    role: hero
    text: Ideas begin quietly.
    x: 43%
    y: 53%
    w: 940
    font_size: 66
    font_weight: 500
    letter_spacing: -2.2
    line_height: 1
    text_align: left
    color: "#FFFFFF"
    at: 0
    duration: 2.8
    enter: {preset: rise, duration: 0.32, delay: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)"}
```

## scene: second-thought
```motion
duration: 2.6
transition: cut
elements:
  - id: second-line
    type: text
    role: hero
    text: Then they move everything.
    x: 47%
    y: 43%
    w: 1180
    font_size: 66
    font_weight: 500
    letter_spacing: -2.2
    line_height: 1
    text_align: left
    color: "#FFFFFF"
    at: 0
    duration: 2.6
    enter: {preset: rise, duration: 0.32, delay: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)"}
  - id: quiet-label
    type: text
    role: label
    text: MOTIOON
    x: 20.5%
    y: 72%
    w: 220
    font_size: 13
    font_weight: 500
    letter_spacing: 0.52
    text_align: left
    color: "#8E8EA0"
    at: 0
    duration: 2.6
```

## scene: point-close
```motion
duration: 1.4
transition: cut
elements:
  - id: closing-point
    type: shape
    shape: circle
    x: 50%
    y: 50%
    w: 16
    h: 16
    fill: "#FFFFFF"
    at: 0
    duration: 1.4
    enter: {preset: rise, duration: 0.32, delay: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)"}
```
