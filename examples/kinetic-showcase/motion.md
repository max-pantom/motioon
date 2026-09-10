---
version: 1
id: kinetic-showcase
title: Type can move like this.
width: 1280
height: 720
fps: 30
duration: 6
background: "#0b0b0d"
theme:
  accent: "#ff6b3d"
  text: "#f7f2e9"
  muted: "#aaa4a0"
---

# Direction

Fast, editorial kinetic typography. Large type, hard contrast, staggered words,
layered color, and transitions that feel designed rather than templated.

## scene: say-it-big
```motion
duration: 2
transition: zoom 0.45
elements:
  - id: glow
    type: shape
    shape: circle
    fill: "#ff4d1f"
    w: 520
    h: 520
    x: 85%
    y: 15%
    blend_mode: screen
    enter: zoom-out 0.8
  - id: headline
    type: text
    text: "TYPE CAN MOVE"
    split: words
    stagger: 0.09
    font_size: 112
    font_weight: 800
    letter_spacing: -4
    line_height: 0.9
    text_stroke: "1px rgba(255,255,255,.12)"
    w: 1080
    x: 47%
    y: 46%
    enter: slide-left 0.55
  - id: index
    type: text
    text: "01 / KINETIC SYSTEM"
    font_size: 15
    letter_spacing: 3
    color: "#ff8a62"
    x: 23%
    y: 76%
    enter: fade 0.35 0.45
```

## scene: word-by-word
```motion
duration: 2
transition: wipe-up 0.4
elements:
  - id: panel
    type: shape
    fill: "#f1e9dc"
    w: 1280
    h: 720
  - id: message
    type: text
    text: "WORD BY WORD\nFRAME BY FRAME"
    split: words
    stagger: 0.075
    font_size: 86
    font_weight: 760
    color: "#141316"
    line_height: 1.03
    w: 1060
    y: 47%
    enter: rotate-in 0.55
  - id: rule
    type: shape
    fill: "#ff4d1f"
    w: 170
    h: 10
    x: 50%
    y: 72%
    enter: wipe-left 0.5 0.55
```

## scene: finish
```motion
duration: 2
transition: slide-left 0.35
elements:
  - id: outline
    type: text
    text: MOTIOON
    split: chars
    stagger: 0.055
    font_size: 154
    font_weight: 850
    color: "transparent"
    text_stroke: "3px #f7f2e9"
    letter_spacing: 5
    w: 1100
    y: 40%
    enter: pop 0.6
  - id: payoff
    type: text
    text: "HTML, WITH A DIRECTOR'S EYE."
    split: words
    stagger: 0.05
    font_size: 22
    letter_spacing: 4
    color: "#ff7a50"
    y: 66%
    enter: blur-in 0.5 0.35
```
