---
version: 1
title: "Ember — Start with a spark."
width: 1920
height: 1080
fps: 30
duration: 10
background: "#FAF5EE"
theme:
  accent: "#E8590C"
  text: "#1C1917"
  muted: "#8A8178"
  font_display: system-ui
  font_body: system-ui
---

## scene: intro

```motion
duration: 2
elements:
  [
    {
        id: spark,
        type: svg,
        w: 280,
        h: 280,
        x: 50%,
        y: 40%,
        svg: "<svg viewBox=\"0 0 120 120\" fill=\"none\"
          xmlns=\"http://www.w3.org/2000/svg\">

          \  <path d=\"M60 16 C74 34 88 44 88 62 a28 28 0 1 1 -56 0 c0 -12 7 -21
          13 -28 l5 12 c2 5 7 6 9 0 l5 -12 z\" stroke=\"#E8590C\"
          stroke-width=\"6\" stroke-linecap=\"round\"
          stroke-linejoin=\"round\"/>

          </svg>",
        enter: draw 1.4 0.1 expo.out
      },
    {
        id: ember-word,
        type: text,
        role: label,
        text: EMBER,
        font_size: 32,
        font_weight: 700,
        letter_spacing: 0.42em,
        color: "#E8590C",
        x: 50%,
        y: 62%,
        split: chars,
        enter: type 0.55 0.7
      }
  ]
```

## scene: concept
```motion
duration: 4.3
at: 2
elements:
  - id: headline
    type: text
    role: hero
    text: Ideas don't wait for the perfect moment.
    font_size: 78
    w: 1500
    x: 50%
    y: 24%
    enter: fade-up 0.7 0.1 expo.out
  - id: card1
    type: shape
    shape: rect
    fill: "#FFE4CE"
    w: 250
    h: 170
    radius: 24
    x: 40%
    y: 50%
    enter: scale-fade 0.5 0.45 expo.out
  - id: card2
    type: shape
    shape: rect
    fill: "#FFCFA8"
    w: 250
    h: 170
    radius: 24
    x: 50%
    y: 50%
    enter: scale-fade 0.5 0.6 expo.out
  - id: card3
    type: shape
    shape: rect
    fill: "#FFBA82"
    w: 250
    h: 170
    radius: 24
    x: 60%
    y: 50%
    enter: scale-fade 0.5 0.75 expo.out
  - id: stat
    type: text
    text: ""
    font_size: 72
    font_weight: 800
    color: "#E8590C"
    x: 50%
    y: 84%
    count:
      to: 12483
      start: 1.1
      duration: 1.5
      easing: expo.out
    animate:
      scale:
        from: 0.96
        to: 1
        start: 1.05
        duration: 0.7
        easing: spring(3, 12)
  - id: stat-label
    type: text
    role: caption
    text: fragments captured this week
    font_size: 22
    color: "#8A8178"
    x: 50%
    y: 92%
    animate:
      opacity:
        from: 0
        to: 1
        start: 1.4
        duration: 0.6
        easing: expo.out
```

## scene: end
```motion
duration: 3.7
at: 6.3
elements:
  - id: spark-sm
    type: svg
    w: 200
    h: 200
    x: 50%
    y: 30%
    svg: >-
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 16 C74 34 88 44 88 62 a28 28 0 1 1 -56 0 c0 -12 7 -21 13 -28 l5 12 c2 5 7 6 9 0 l5 -12 z" stroke="#E8590C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    enter: draw 1.1 0.2 expo.out
  - id: big
    type: text
    role: hero
    text: Start with a spark.
    font_size: 96
    x: 50%
    y: 52%
    enter: fade-up 0.75 0.4 expo.out
  - id: sub
    type: text
    role: sub
    text: Ember · your fragments, one place.
    font_size: 30
    x: 50%
    y: 68%
    enter: fade 0.6 1.2
```
