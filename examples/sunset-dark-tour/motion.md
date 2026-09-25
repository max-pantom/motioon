---
version: 1
id: sunset-dark-tour
title: Sunset — Dark marketplace tour
width: 1920
height: 1080
fps: 24
duration: 12
background: "#030303"
safe_area: 80
theme:
  text: "#F2F2F0"
  muted: "#A6A6A6"
  accent: "#0071E3"
assets:
  home: ./assets/homepage.png
  project: ./assets/nomo-project.png
  developer: ./assets/developer.png
audio:
  master: {lufs: -16, peak: -1.5, sample_rate: 48000}
  tracks:
    - {id: home-click, kind: sting, src: ./assets/tick.wav, at: "event:open-nomo", gain_db: -13, oneshot: true}
    - {id: profile-click, kind: sting, src: ./assets/tick.wav, at: "event:open-developer", gain_db: -13, oneshot: true}
---

# Creative direction

An actual click path captured from the locally running Sunset app in dark mode.
The images are Chromium captures at 1600 × 900, and `assets/capture.json` records
the visited URLs and measured link bounds. No page is redrawn or fabricated.
Only the capture panels, cursor paths, and restrained 2.5D entrances are
animated. The cursor opens Nomo from Featured, then the Nomo developer profile.
No additional copy or payment interaction.

## scene: home
```motion
kind: ui
duration: 4
transition: cut
camera: {from: 1, to: 1.025, duration: 3.8, anchor: [35%, 49%]}
cursor:
  x: 81%
  y: 16%
  click_color: "#0071E3"
  path:
    - {t: 0, x: 81%, y: 16%}
    - {t: 1.7, x: 60%, y: 34%, ease: expo-out}
    - {t: 2.85, x: 35%, y: 49.5%, ease: expo-out}
    - {t: 3.45, x: 35%, y: 49.5%, ease: linear, click: true, event: open-nomo}
    - {t: 3.95, x: 35%, y: 49.5%, ease: linear}
elements:
  - id: home-panel
    type: group
    enter: tilt-in 0.62
    keyframes:
      rotateY:
        - {t: 0, v: -9}
        - {t: 0.8, v: 0, ease: expo-out}
      rotateX:
        - {t: 0, v: 4}
        - {t: 0.8, v: 0, ease: expo-out}
    children:
      - id: home-shadow
        type: shape
        shape: rect
        x: 50%
        y: 50%
        w: 1600
        h: 900
        fill: "#0A0A0A"
        shadow: "0 30px 100px rgba(0,0,0,.7)"
      - id: real-home
        type: image
        src: asset:home
        fit: contain
        x: 50%
        y: 50%
        w: 1600
        h: 900
```

## scene: nomo
```motion
kind: ui
duration: 4
transition: cut
camera: {from: 1, to: 1.03, duration: 3.6, anchor: [60%, 43%]}
cursor:
  x: 35%
  y: 49.5%
  click_color: "#0071E3"
  path:
    - {t: 0, x: 35%, y: 49.5%}
    - {t: 1.1, x: 69%, y: 33%, ease: expo-out}
    - {t: 1.75, x: 69%, y: 33%, ease: linear}
    - {t: 2.95, x: 29.8%, y: 44.3%, ease: expo-out}
    - {t: 3.5, x: 29.8%, y: 44.3%, ease: linear, click: true, event: open-developer}
    - {t: 3.95, x: 29.8%, y: 44.3%, ease: linear}
elements:
  - id: nomo-panel
    type: group
    enter: tilt-in 0.58
    keyframes:
      rotateY:
        - {t: 0, v: 8}
        - {t: 0.75, v: 0, ease: expo-out}
      rotateX:
        - {t: 0, v: -3}
        - {t: 0.75, v: 0, ease: expo-out}
    children:
      - id: nomo-shadow
        type: shape
        shape: rect
        x: 50%
        y: 50%
        w: 1600
        h: 900
        fill: "#0A0A0A"
        shadow: "0 30px 100px rgba(0,0,0,.7)"
      - id: real-nomo
        type: image
        src: asset:project
        fit: contain
        x: 50%
        y: 50%
        w: 1600
        h: 900
```

## scene: developer
```motion
kind: ui
duration: 4
transition: cut
camera: {from: 1, to: 1.035, duration: 3.8, anchor: [49%, 57%]}
cursor:
  x: 29.8%
  y: 44.3%
  path:
    - {t: 0, x: 29.8%, y: 44.3%}
    - {t: 1.15, x: 50%, y: 30%, ease: expo-out}
    - {t: 2.5, x: 36%, y: 73%, ease: expo-out}
    - {t: 3.9, x: 36%, y: 73%, ease: linear}
elements:
  - id: developer-panel
    type: group
    enter: tilt-in 0.64
    keyframes:
      rotateY:
        - {t: 0, v: -7}
        - {t: 0.85, v: 0, ease: expo-out}
      rotateX:
        - {t: 0, v: 4}
        - {t: 0.85, v: 0, ease: expo-out}
    children:
      - id: developer-shadow
        type: shape
        shape: rect
        x: 50%
        y: 50%
        w: 1600
        h: 900
        fill: "#0A0A0A"
        shadow: "0 30px 100px rgba(0,0,0,.7)"
      - id: real-developer
        type: image
        src: asset:developer
        fit: contain
        x: 50%
        y: 50%
        w: 1600
        h: 900
```
