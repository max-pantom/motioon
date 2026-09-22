# Format and commands

Read the bundled [SPEC.md](../../../SPEC.md) for the complete format and runtime
API. If installed separately, ask `motion_read_spec` through MCP or read SPEC.md
from the Motioon installation reported by `motioon agent`.

````markdown
---
title: Launch
width: 1280
height: 720
fps: 30
duration: 3
background: "#15121f"
---

# Direction

One confident headline. Give it room to breathe.

## scene: intro

```motion
duration: 3
elements:
  - id: headline
    type: text
    role: hero
    text: Something worth moving for.
    w: 1100
    font_size: 76
    split: words
    stagger: 0.06
    enter: fade-up 0.6
```
````

For an HTML shot, replace the scene with a timed heading and HTML:

```html
## Scene: intro (0s-3s)
<h1 id="headline" data-motion="headline">Something worth moving for.</h1>
<script>
  motion.animate("#headline", {
    opacity: [0, 1],
    y: [24, 0],
    start: 0,
    duration: 0.6,
  });
</script>
```

`motion.md` supports `aspect` or `aspect_ratio`, assets as a mapping or list, and
seconds (`1.2`/`1.2s`), milliseconds (`200ms`), or frame times (`30f`). Header and
scene durations must contain all their content. Structured position x/y describes
the element center; numbers mean pixels, percentage strings mean canvas percent.

Kinetic presets include `slide-left`, `slide-right`, `pop`, `zoom-out`,
`rotate-in`, `wipe-left`, `wipe-up`, and `blur-in`. Scene transitions support
`cut`, `fade`, `wipe-left`, `wipe-up`, `slide-left`, and `zoom`.

Useful commands:

```sh
motioon validate ./motion.md
motioon inspect ./motion.md --frames 0,15,45,89 -o ./inspection
motioon render ./motion.md -o ./video.mp4 --workers 2
motioon studio ./motion.md --port 4400
```
