---
id: product-launch
title: Product launch
aspect: 9:16
fps: 30
duration: 8
background: "#07070A"
safe_area: 72
theme:
  accent: "#7C5CFF"
  text: "#F5F5F7"
  muted: "#A1A1AA"
assets:
  mark: ./assets/mark.svg
---

## scene: hook
```motion
duration: 2.6
transition: fade 0.2
elements:
  - id: kicker
    type: text
    role: label
    text: NEW
    y: 38%
    enter: fade 0.3
  - id: title
    type: text
    role: hero
    text: "Your calendar,\nfinally."
    y: 48%
    enter: fade-up 0.5 0.15
  - id: sub
    type: text
    role: sub
    text: Plans that move when you do.
    y: 64%
    enter: fade 0.4 0.45
```

## scene: product
```motion
duration: 2.8
transition: fade 0.24
elements:
  - id: plate
    type: shape
    shape: rect
    fill: "#12121A"
    w: 78%
    h: 42%
    radius: 36
    enter: scale-fade 0.45
  - id: mark
    type: image
    src: asset:mark
    y: 44%
    w: 160
    h: 160
    enter: scale-fade 0.5 0.1
  - id: product-title
    type: text
    role: caption
    text: Motion Calendar
    y: 62%
    enter: fade-up 0.4 0.2
```

## scene: endcard
```motion
duration: 2.6
transition: fade 0.2
elements:
  - id: cta-label
    type: text
    role: label
    text: GET IT
    y: 42%
    enter: fade 0.3
  - id: cta
    type: text
    role: hero
    text: "Start in\none tap."
    y: 52%
    enter: fade-up 0.45 0.1
```
