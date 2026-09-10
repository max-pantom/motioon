---
version: 1
title: Bart — See what stays with you
width: 1080
height: 1080
fps: 30
duration: 12
background: "#f3f1ec"
safe_area: 64
theme:
  text: "#101010"
  muted: "#6e6a63"
  accent: "#1547d8"
  font_display: "bart_inter"
  font_body: "bart_inter"
assets:
  bart_inter:
    src: ./assets/InterVariable.woff2
    type: font
  lamp: ./assets/cobalt-lamp.png
  chair: ./assets/coral-chair.png
  textile: ./assets/pleated-study.png
  soundtrack: ./assets/bart-tone.m4a
audio:
  - src: asset:soundtrack
    at: 0
    trim: 0
    duration: 12
    volume: 1
---

# Creative direction

A 12-second launch film for Bart, a fictional visual discovery app. Match the
quiet editorial rhythm of the Cosmos reference: warm off-white space, restrained
black type, contextual labels, collected objects, and confident scale changes.
All product imagery is original GPT Image output created specifically for Bart.
Every scene uses structured Motioon elements so it remains visible and editable
in Studio.

## scene: question
```motion
duration: 2.4
transition: fade 0.18
elements:
  - id: question-kicker
    type: text
    role: label
    text: A thought for your eyes
    x: 50%
    y: 39%
    w: 500
    font_size: 18
    font_weight: 500
    letter_spacing: 1.8
    text_transform: uppercase
    color: "#77716a"
    enter: blur-in 0.45
    exit: fade 0.18 0
  - id: question-copy
    type: text
    role: hero
    text: "What deserves\na second look?"
    x: 50%
    y: 50%
    w: 880
    font_size: 68
    font_weight: 480
    line_height: 1.03
    split: words
    stagger: 0.09
    enter: fade-up 0.55 0.12 expo.out
    exit: blur-in 0.2 0
  - id: question-dot
    type: shape
    role: accent
    shape: circle
    x: 69%
    y: 58.5%
    w: 17
    h: 17
    fill: "#ff6548"
    enter: pop 0.4 0.72 expo.out
```

## scene: collection
```motion
duration: 3.1
transition: zoom 0.34
elements:
  - id: collection-label
    type: text
    role: label
    text: Three things worth keeping
    x: 50%
    y: 13%
    w: 580
    font_size: 18
    font_weight: 520
    letter_spacing: 1.5
    text_transform: uppercase
    color: "#6e6a63"
    enter: fade-up 0.45 0.05
  - id: lamp-card
    type: image
    role: object
    src: asset:lamp
    x: 19%
    y: 49%
    w: 300
    h: 430
    fit: cover
    radius: 2
    enter: slide-right 0.65 0.05 expo.out
    exit: fade 0.2
  - id: chair-card
    type: image
    role: object
    src: asset:chair
    x: 50%
    y: 51%
    w: 330
    h: 500
    fit: cover
    radius: 2
    enter: fade-up 0.65 0.12 expo.out
    exit: zoom-out 0.24
  - id: textile-card
    type: image
    role: object
    src: asset:textile
    x: 81%
    y: 49%
    w: 300
    h: 430
    fit: cover
    radius: 2
    enter: slide-left 0.65 0.19 expo.out
    exit: fade 0.2
  - id: lamp-label
    type: text
    role: caption
    text: Light
    x: 8%
    y: 50%
    w: 160
    font_size: 31
    font_weight: 450
    blend_mode: difference
    color: "#ffffff"
    enter: fade 0.35 0.42
  - id: chair-label
    type: text
    role: caption
    text: Form
    x: 42%
    y: 50%
    w: 160
    font_size: 31
    font_weight: 450
    blend_mode: difference
    color: "#ffffff"
    enter: fade 0.35 0.51
  - id: textile-label
    type: text
    role: caption
    text: Texture
    x: 74%
    y: 50%
    w: 190
    font_size: 31
    font_weight: 450
    blend_mode: difference
    color: "#ffffff"
    enter: fade 0.35 0.6
  - id: collection-count
    type: text
    role: label
    text: 01 — 03
    x: 50%
    y: 86%
    w: 220
    font_size: 17
    color: "#8b857e"
    enter: fade 0.35 0.65
```

## scene: object
```motion
duration: 3.6
transition: wipe-up 0.38
elements:
  - id: object-image
    type: image
    role: product
    src: asset:lamp
    x: 50%
    y: 37%
    w: 790
    h: 625
    fit: cover
    radius: 3
    enter: zoom-out 0.72 0 expo.out
    exit: wipe-up 0.26
  - id: object-index
    type: text
    role: label
    text: OBJECT  /  001
    x: 18%
    y: 72%
    w: 260
    font_size: 16
    font_weight: 550
    letter_spacing: 1.4
    color: "#77716a"
    enter: fade-up 0.42 0.32
  - id: object-name
    type: text
    role: sub
    text: Cobalt Orbit Lamp
    x: 50%
    y: 76%
    w: 660
    font_size: 39
    font_weight: 470
    enter: fade-up 0.5 0.4 expo.out
  - id: object-maker
    type: text
    role: caption
    text: Found by Bart · Material study in cast glass
    x: 50%
    y: 82%
    w: 720
    font_size: 19
    font_weight: 430
    color: "#69645e"
    enter: blur-in 0.5 0.58
  - id: save-button
    type: shape
    role: control
    shape: pill
    x: 50%
    y: 90%
    w: 154
    h: 54
    fill: "#101010"
    enter: pop 0.42 0.82 expo.out
  - id: save-label
    type: text
    role: label
    text: +  SAVE
    x: 50%
    y: 90%
    w: 130
    font_size: 16
    font_weight: 620
    letter_spacing: 1.1
    color: "#ffffff"
    enter: fade 0.28 0.92
```

## scene: launch
```motion
duration: 2.9
transition: fade 0.25
elements:
  - id: launch-line
    type: text
    role: sub
    text: Now collecting at
    x: 50%
    y: 39%
    w: 600
    font_size: 26
    font_weight: 440
    color: "#5f5a54"
    split: words
    stagger: 0.07
    enter: fade-up 0.5 0.05 expo.out
  - id: bart-wordmark
    type: text
    role: hero
    text: BART
    x: 50%
    y: 51%
    w: 700
    font_size: 112
    font_weight: 590
    letter_spacing: -6
    split: chars
    stagger: 0.08
    enter: wipe-up 0.62 0.42 expo.out
  - id: bart-dot
    type: shape
    role: accent
    shape: circle
    x: 67.8%
    y: 45.5%
    w: 19
    h: 19
    fill: "#1547d8"
    enter: pop 0.38 0.98 expo.out
  - id: bart-url-bg
    type: shape
    role: badge
    shape: pill
    x: 50%
    y: 66%
    w: 226
    h: 58
    fill: "#ffffff"
    shadow: "0 8px 24px rgba(20,18,15,.08)"
    enter: scale-fade 0.45 1.1 expo.out
  - id: bart-url
    type: text
    role: label
    text: bart.place  ↗
    x: 50%
    y: 66%
    w: 190
    font_size: 18
    font_weight: 560
    letter_spacing: 0.4
    enter: fade 0.3 1.24
  - id: bart-tagline
    type: text
    role: label
    text: SEE WHAT STAYS WITH YOU
    x: 50%
    y: 82%
    w: 520
    font_size: 15
    font_weight: 540
    letter_spacing: 2.8
    color: "#77716a"
    enter: blur-in 0.5 1.5
```
