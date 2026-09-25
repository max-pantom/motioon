---
title: Motioon — One prompt. One film.
version: 1
width: 1920
height: 1080
fps: 30
duration: 12
background: "#000"
theme:
  accent: "#8B7CFF"
  text: "#FAFAFC"
  muted: "#9AA0AC"
  font_display: system-ui
  font_body: system-ui

---

# Direction
Dark cinematic typographic launch. One focal movement per scene, long holds, and a single spring accent on the stat card.


## scene: open
```motion
duration: 2.4
elements:
  - id: glow
    type: svg
    svg: |-
      <svg viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="g"><stop
          offset="0%" stop-color="#8B7CFF" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#8B7CFF" stop-opacity="0"/></radialGradient></defs>
        <rect width="1200" height="1200" fill="url(#g)"/>
      </svg>
    w: 1200
    h: 1200
    x: 50%
    y: 50%
    animate:
      opacity:
        from: 0
        to: 1
        start: 0
        duration: 1.6
        easing: expo.out
      scale:
        from: 0.82
        to: 1
        start: 0
        duration: 2
        easing: expo.out
  - id: word
    type: text
    text: MOTIOON
    role: label
    font_size: 34
    font_weight: 700
    letter_spacing: 0.5em
    color: "#8b7cff"
    x: 50%
    y: 50%
    split: chars
    stagger: 0.145
    enter:
      preset: slide-left
      duration: 0.55
      delay: 0.1
      easing: expo.out
    scale: 1
    rotation: 0
    opacity: 1
    at: 0
    duration: 2.4
    hidden: false
```

## scene: statement
```motion
duration: 3.8
elements:
  - id: headline
    type: text
    text: Your launch video.
    role: hero
    w: 1600
    font_size: 104
    x: 50%
    y: 40%
    enter:
      preset: type
      duration: 1.7
      delay: 0.15
      easing: expo.out
  - id: rule
    type: svg
    svg: |-
      <svg viewBox="0 0 220 4" xmlns="http://www.w3.org/2000/svg"><line
          x1="0" y1="2" x2="220" y2="2" stroke="#8B7CFF" stroke-width="3"
          stroke-linecap="round"/></svg>
    w: 220
    h: 4
    x: 50%
    y: 58%
    enter:
      preset: draw
      duration: 0.9
      delay: 1.5
      easing: expo.out
  - id: note
    type: caption
    text: Edited in markdown. Rendered in seconds.
    font_size: 26
    color: "#9AA0AC"
    x: 50%
    y: 66%
    enter:
      preset: fade
      duration: 0.6
      delay: 2.2
      easing: expo.out
```

## scene: showcase
```motion
duration: 3
elements:
  - id: cardBg
    type: shape
    shape: rect
    fill: "#10131c"
    w: 960
    h: 460
    radius: 28
    x: 50%
    y: 53%
    enter:
      preset: slide-right
      duration: 0.65
      delay: 0.1
      easing: linear
    animate:
      scale:
        from: 0.94
        to: 1
        start: 0.28
        duration: 0.8
        easing: spring(3, 14)
    scale: 1
    rotation: 0
    opacity: 1
    at: 0
    duration: 3
    hidden: false
  - id: n300
    type: text
    text: ""
    font_size: 64
    font_weight: 800
    color: "#8B7CFF"
    x: 34%
    y: 39%
    count:
      to: 300
      from: 0
      start: 0.55
      duration: 1.4
      easing: expo.out
      prefix: ""
      suffix: ""
      decimals: 0
      thousands: true
  - id: c300
    type: caption
    text: frames rendered
    font_size: 26
    color: "#9AA0AC"
    x: 53%
    y: 39%
    enter:
      preset: fade
      duration: 0.5
      delay: 0.75
      easing: expo.out
  - id: n43
    type: text
    text: ""
    font_size: 64
    font_weight: 800
    color: "#8B7CFF"
    x: 34%
    y: 53%
    count:
      to: 43
      from: 0
      start: 0.8
      duration: 1.2
      easing: expo.out
      prefix: ""
      suffix: ""
      decimals: 0
      thousands: true
  - id: c43
    type: caption
    text: seconds of film
    font_size: 26
    color: "#9AA0AC"
    x: 53%
    y: 53%
    enter:
      preset: fade
      duration: 0.5
      delay: 0.95
      easing: expo.out
  - id: n1
    type: text
    text: ""
    font_size: 64
    font_weight: 800
    color: "#8B7CFF"
    x: 34%
    y: 67%
    count:
      to: 1
      from: 0
      start: 1.05
      duration: 1
      easing: expo.out
      prefix: ""
      suffix: ""
      decimals: 0
      thousands: true
  - id: c1
    type: caption
    text: one prompt
    font_size: 26
    color: "#9AA0AC"
    x: 53%
    y: 67%
    enter:
      preset: fade
      duration: 0.5
      delay: 1.15
      easing: expo.out
```

## scene: end
```motion
duration: 2.8
elements:
  - id: big
    type: text
    text: One prompt. One film.
    role: hero
    w: 1700
    font_size: 88
    x: 50%
    y: 40%
    enter:
      preset: fade-up
      duration: 0.7
      delay: 0.5
      easing: expo.out
  - id: tagline
    type: text
    text: Motion — editable HTML video for agents
    role: sub
    font_size: 28
    x: 50%
    y: 56%
    enter:
      preset: fade
      duration: 0.6
      delay: 1.3
      easing: expo.out
```

