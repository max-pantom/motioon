---
version: 1
id: made-with-motioon
title: A little idea. A lot of motion.
aspect: "16:9"
width: 1280
height: 720
fps: 30
duration: 8
background: "#f1eff9"
safe_area: 64
theme:
  accent: "#7358b7"
  text: "#242035"
  muted: "#756d86"
assets:
  mark: ./assets/mark.svg
---

# Creative direction

A calm, confident introduction to Motioon. Warm lavender, expressive type,
and simple geometric forms. Give each thought room to land. Keep text inside
safe areas. The final frame should feel finished, not fade to nothing.

## scene: a-little-idea
```motion
duration: 3
elements:
  - id: halo
    type: shape
    shape: circle
    fill: "#e5def7"
    x: 78%
    y: 48%
    w: 370
    h: 370
    enter: scale-fade 0.9
  - id: orbit
    type: html
    x: 78%
    y: 48%
    w: 450
    h: 450
    html: |
      <svg viewBox="0 0 450 450" width="450" height="450" aria-hidden="true">
        <ellipse cx="225" cy="225" rx="208" ry="86" transform="rotate(-36 225 225)" fill="none" stroke="#aa97cf" stroke-width="1.5"/>
        <circle cx="394" cy="103" r="15" fill="#8466bc"/>
        <circle cx="71" cy="354" r="7" fill="#b6a2d5"/>
      </svg>
    enter: fade 0.8 0.1
  - id: motion-mark
    type: text
    text: We
    font_size: 180
    font_weight: 750
    color: "#7b5bb2"
    x: 78%
    y: 46%
    enter:
      preset: scale-fade
      duration: 0.7
      delay: 0.2
      easing: ease-out
    scale: 1
    rotation: 0
    opacity: 1
    at: 0
    duration: 3
    hidden: false
  - id: label
    type: text
    role: label
    text: MEET MOTIOON
    x: 56%
    y: 23%
    enter:
      preset: fade
      duration: 0.4
      delay: 0
      easing: ease-out
    font_size: 16
    color: "#7358b7"
    scale: 1
    rotation: 0
    opacity: 1
    at: 0
    duration: 3
    hidden: false
  - id: headline
    type: text
    role: hero
    text: "A little idea.\nA lot of motion."
    font_size: 76
    font_weight: 650
    w: 670
    x: 31%
    y: 47%
    enter: fade-up 0.7 0.12
  - id: subtitle
    type: text
    role: sub
    text: From a few words to something moving.
    font_size: 20
    w: 650
    x: 31%
    y: 68%
    enter: fade 0.6 0.35
  - id: footer
    type: text
    text: YOUR IDEAS, IN MOTION.
    font_size: 11
    color: "#81788f"
    x: 50%
    y: 92%
    enter: fade 0.6 0.5
```

## scene: make-it-yours
```motion
duration: 2.8
elements:
  - id: card
    type: shape
    fill: "#ffffff"
    w: 900
    h: 440
    radius: 32
    enter: scale-fade 0.55
  - id: logo
    type: image
    src: asset:mark
    w: 90
    h: 90
    y: 32%
    enter: scale-fade 0.6 0.1
  - id: editable-title
    type: text
    role: hero
    text: Make it yours.
    font_size: 76
    y: 51%
    enter: fade-up 0.6 0.2
  - id: editable-description
    type: text
    role: sub
    text: Every word. Every frame. Every little detail.
    font_size: 22
    y: 66%
    enter: fade 0.5 0.4
```

## scene: out-into-the-world
```motion
duration: 2.2
elements:
  - id: final-label
    type: text
    role: label
    text: MADE WITH MOTIOON
    y: 31%
    enter: fade 0.3
  - id: final-title
    type: text
    role: hero
    text: Give your ideas a little life.
    font_size: 76
    w: 1000
    y: 47%
    enter: fade-up 0.6 0.1
  - id: final-caption
    type: text
    role: sub
    text: Imagine. Adjust. Export.
    font_size: 24
    y: 66%
    enter: fade 0.5 0.3
```
