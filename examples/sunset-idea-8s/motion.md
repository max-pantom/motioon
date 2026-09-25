---
version: 1
id: sunset-secondary-market
title: Sunset — The secondary market for software
width: 1920
height: 1080
fps: 24
duration: 14
background: "#FFFFFF"
safe_area: 120
theme:
  text: "#121212"
  muted: "#6E6E6E"
  accent: "#0071E3"
  font_display: geist
  font_body: geist
brand:
  accent: "#0071E3"
  typeScale: {hero: 178, title: 54, body: 42, caption: 27}
  spacing: [4, 8, 10, 12, 16, 20, 24, 32, 40, 48]
  radius: 20
  logoLockup:
    mark: asset:mark
    wordmark: Sunset
    markWidth: 28
    markHeight: 26
    fontSize: 24
    fontWeight: 500
    fontFamily: geist
    gap: 8
    tracking: "-0.035em"
assets:
  geist: {src: ./assets/geist.woff2, type: font}
  mark: ./assets/sunset-mark.svg
  homepage: ./assets/site/homepage.png
  nomo-hover: ./assets/site/project-card-hover.png
  nomo-page: ./assets/site/project.png
audio:
  master: {lufs: -16, peak: -1.5, sample_rate: 48000}
  tracks:
    - {id: air, kind: music, src: ./assets/audio/air.wav, start: 0, end: 14, gain_db: -22, fade_in: 0.4, fade_out: 0.9}
    - {id: typing, kind: sting, src: ./assets/audio/tick.wav, at: [0.55, 0.92, 1.28], gain_db: -18, oneshot: true}
    - {id: list-click, kind: sting, src: ./assets/audio/tick.wav, at: "event:list-click", gain_db: -10, oneshot: true}
    - {id: site-arrive, kind: sting, src: ./assets/audio/arrival.wav, at: 3.56, gain_db: -15, oneshot: true}
    - {id: project-click, kind: sting, src: ./assets/audio/tick.wav, at: "event:project-open", gain_db: -10, oneshot: true}
    - {id: project-arrive, kind: sting, src: ./assets/audio/arrival.wav, at: 8.54, gain_db: -17, oneshot: true}
    - {id: logo-arrive, kind: sting, src: ./assets/audio/arrival.wav, at: 12.05, gain_db: -12, oneshot: true}
---

# Creative direction

Fourteen-second idea film. White remains dominant. The website images are actual
Chromium captures of the running Sunset app at 1600 × 900, recorded in
`assets/site/capture.json`; they are not rebuilt UI. The Nomo card hover layer
is a DOM element capture from that same page, aligned to its measured bounds.
Nomo is a live listing on the captured homepage, and its $500 price comes from
the page. No price count or fabricated listing appears. The cursor and card
hover remain editable Motion layers. Do not invent additional copy. Accent blue
is reserved for the typing caret, click feedback, and Sunset's actual button.

## scene: software
```motion
kind: card
duration: 2.2
transition: cut
elements:
  - id: software-typed
    type: text
    text: "Buy and sell software."
    x: 50%
    y: 50%
    w: 1550
    font_size: 152
    font_weight: 500
    letter_spacing: -8
    color: "#121212"
    typewriter: { cps: 13, from: 0.13, caret: true, caret_color: "#0071E3" }
    stagger: 0.045
    scale: 1
    rotation: 0
    opacity: 1
    hidden: false
    at: 0
    duration: 2.2
    enter: fade 0.62
at: 0
```

## scene: list-action
```motion
kind: object
duration: 1.3
transition: cut
cursor:
  x: 84%
  y: 76%
  click_color: "#0071E3"
  path:
    - { t: 0, x: 84%, y: 76% }
    - { t: 0.69, x: 52%, y: 51%, ease: expo-out }
    - { t: 0.95, x: 52%, y: 51%, ease: linear, click: true, event: list-click }
    - { t: 1.28, x: 52%, y: 51%, ease: linear }
elements:
  - id: list-button
    type: group
    enter: null
    behaviors:
      - { type: compress, scale: 0.96, duration: 0.16, on: list-click }
    children:
      - id: list-button-surface
        type: shape
        shape: pill
        x: 50%
        y: 51%
        w: 520
        h: 128
        fill: "#FEFEFE"
        radius: 64
        shadow: "0 0 0 2px rgba(10,10,10,.13), 0 16px 45px rgba(0,0,0,.08)"
      - id: list-button-selected
        type: shape
        shape: pill
        x: 50%
        y: 51%
        w: 520
        h: 128
        fill: "transparent"
        radius: 64
        shadow: "inset 0 0 0 8px #0071E3"
        at: 0.95
        duration: 0.35
        enter: fade 0.08
      - id: list-plus
        type: text
        text: "+"
        x: 42.4%
        y: 50.5%
        w: 70
        font_size: 60
        font_weight: 300
        color: "#101010"
      - id: list-label
        type: text
        text: List a project
        x: 52%
        y: 51%
        w: 570
        font_size: 52
        font_weight: 500
        letter_spacing: -1.8
        color: "#101010"
    x: 50%
    y: 50%
    w: 5
    scale: 1
    rotation: 0
    opacity: 1
    hidden: false
    at: 0
    duration: 1.3
```

## scene: marketplace
```motion
kind: ui
duration: 5
transition: cut
cursor:
  x: 52%
  y: 51%
  click_color: "#0071E3"
  path:
    - { t: 0, x: 52%, y: 51% }
    - { t: 1.3, x: 57%, y: 52%, ease: expo-out }
    - { t: 2.45, x: 62.9%, y: 62.2%, ease: expo-out }
    - {
        t: 4.5,
        x: 62.9%,
        y: 61.1%,
        ease: linear,
        click: true,
        event: project-open
      }
    - { t: 4.95, x: 62.9%, y: 61.1%, ease: linear }
elements:
  - id: site-panel
    type: group
    enter: null
    animate:
      y: { from: 0, to: -20, start: 2.6, duration: 1.5, easing: ease-in-out }
    children:
      - id: site-shadow
        type: shape
        shape: rect
        x: 50%
        y: 50%
        w: 1600
        h: 900
        fill: "#FFFFFF"
        shadow: "0 24px 75px rgba(0,0,0,.11)"
      - id: real-homepage
        type: image
        src: asset:homepage
        fit: contain
        x: 50%
        y: 50%
        w: 1600
        h: 900
      - id: nomo-hover
        type: image
        src: asset:nomo-hover
        fit: contain
        x: 62.86%
        y: 63%
        w: 516
        h: 349
        at: 2.35
        duration: 2.65
        enter: fade 0.15
    x: 50%
    y: 50%
    scale: 1.1
    rotation: 0
    opacity: 1
    hidden: false
    at: 0
    duration: 5
```

## scene: project-page
```motion
kind: ui
duration: 2
transition: cut
cursor:
  x: 62.9%
  y: 61.1%
  path:
    - { t: 0, x: 62.9%, y: 61.1% }
    - { t: 1.22, x: 69.5%, y: 44.2%, ease: expo-out }
    - { t: 1.95, x: 69.5%, y: 44.2%, ease: linear }
elements:
  - id: project-shadow
    type: shape
    shape: rect
    x: 50%
    y: 50%
    w: 1600
    h: 900
    fill: "#ffffff"
    shadow: "0 24px 75px rgba(0,0,0,.11)"
    scale: 1
    rotation: 0
    opacity: 1
    hidden: true
    at: 0
    duration: 2
    enter: null
  - id: real-nomo-page
    type: image
    src: asset:nomo-page
    fit: contain
    x: 50%
    y: 50%
    w: 1600
    h: 900
    enter: fade 0.24
```

## scene: changes-hands
```motion
kind: card
duration: 1.5
transition: cut
elements:
  - id: site-pullout
    type: image
    src: asset:nomo-page
    fit: contain
    x: 50%
    y: 50%
    w: 1600
    h: 900
    animate:
      scale: { from: 1, to: 0.56, start: 0, duration: 0.42, easing: expo.out }
      opacity: { from: 1, to: 0, start: 0.18, duration: 0.55, easing: ease-out }
    scale: 1
    rotation: 0
    opacity: 1
    hidden: false
    at: 0
    duration: 1
    enter: null
  - id: changes-hands-line
    type: text
    text: Software changes hands.
    x: 50%
    y: 50%
    w: 1800
    font_size: 95
    font_weight: 500
    letter_spacing: -4
    color: "#121212"
    enter:
      preset: blur-in
      duration: 0.4
      delay: 0
      easing: ease-out
    stagger: 0.045
    scale: 1
    rotation: 0
    opacity: 1
    hidden: false
    at: 0
    duration: 1.5
    split: words
```

## scene: sunset
```motion
kind: card
duration: 2
transition: cut
elements:
  - id: sunset-lockup
    type: brand-lockup
    x: 50%
    y: 45%
    w: 1000
    h: 190
    font_size: 116
    color: "#121212"
    enter: null
    scale: 0.8
    rotation: 0
    opacity: 1
    hidden: false
    at: 0
    duration: 2
  - id: sunset-tagline
    type: text
    text: The secondary market for software.
    x: 50%
    y: 58%
    w: 1350
    font_size: 48
    font_weight: 400
    letter_spacing: -1.7
    color: "#333333"
    enter: fade 0.38 0.3 expo.out
  - id: sunset-url
    type: text
    text: usesunset.xyz
    x: 50%
    y: 68%
    w: 750
    font_size: 36
    font_weight: 500
    letter_spacing: -0.6
    color: "#0071e3"
    enter:
      preset: fade
      duration: 0.38
      delay: 0.55
      easing: expo.out
    stagger: 0.045
    scale: 1
    rotation: 0
    opacity: 1
    hidden: false
    at: 0
    duration: 2
```
