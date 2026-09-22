---
version: 1
id: sunset-launch
title: Sunset
width: 1080
height: 1350
fps: 60
duration: 8
background: "#ffffff"
safe_area: 64
theme:
  accent: "#FF7043"
  text: "#161616"
  muted: "#8a8a8a"
  font_display: "system-ui"
  font_body: "system-ui"
assets:
  sunset: ./assets/sunset.svg
audio: []
---

# Creative direction

An eight-second, 4:5 launch film. White background, minimal. Quiet and
confident: one focal movement per scene, hold everything else still. The old
project is still worth $2,400. End on "Sunset."

## scene: intro
```motion
duration: 1.5
elements:
  - id: sun-mark
    type: image
    src: asset:sunset
    w: 260
    h: 260
    x: 50%
    y: 42%
    enter: scale-fade 0.7 0 expo.out
  - id: sun-word
    type: text
    role: label
    text: SUNSET
    font_size: 30
    font_weight: 700
    letter_spacing: 0.32em
    color: "#FF7043"
    x: 50%
    y: 60%
    split: chars
    enter: type 0.5 0.35
```

## scene: value
```motion
duration: 3.7
elements:
  - id: claim
    type: text
    role: sub
    text: An old project is still worth more than you think.
    font_size: 30
    w: 660
    x: 50%
    y: 26%
    enter: fade-up 0.7 0.1 expo.out
  - id: price
    type: text
    text: ""
    font_size: 180
    font_weight: 800
    color: "#FF7043"
    x: 50%
    y: 48%
    enter: reveal 0.9 0.35 expo.out
    count:
      from: 0
      to: 2400
      start: 0.55
      duration: 1.8
      easing: expo.out
      prefix: "$"
  - id: provenance
    type: text
    role: caption
    text: One 2019 freelance build. Resold three times since.
    font_size: 24
    color: "#8a8a8a"
    x: 50%
    y: 63%
    animate:
      opacity:
        from: 0
        to: 1
        start: 2.7
        duration: 0.6
        easing: expo.out
```

## scene: end
```motion
duration: 2.8
elements:
  - id: endcard
    type: group
    at: 0
    children:
      - id: dusk-rays
        type: svg
        w: 200
        h: 200
        x: 50%
        y: 30%
        svg: |
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="100" y1="14" x2="100" y2="44" stroke="#161616" stroke-width="6" stroke-linecap="round"/>
            <line x1="40" y1="50" x2="57" y2="69" stroke="#161616" stroke-width="6" stroke-linecap="round"/>
            <line x1="160" y1="50" x2="143" y2="69" stroke="#161616" stroke-width="6" stroke-linecap="round"/>
            <line x1="18" y1="118" x2="182" y2="118" stroke="#161616" stroke-width="6" stroke-linecap="round"/>
          </svg>
        enter: draw 1.2 0 expo.out
      - id: sunset-word
        type: text
        role: hero
        text: Sunset.
        font_size: 96
        font_weight: 800
        x: 50%
        y: 62%
        enter: fade-up 0.8 0.45 expo.out
      - id: sunset-sub
        type: text
        role: sub
        text: It's already yours.
        font_size: 26
        x: 50%
        y: 74%
        enter: fade 0.6 1.05
```