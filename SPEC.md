# Motioon v1 authoring contract

`motion.md` contains a YAML header, creative direction, and scenes. Both input
formats supplied with this project are supported and can be mixed. HTML, CSS,
SVG and deterministic JavaScript are supported. The CLI, MCP, Studio and renderer
consume the same normalized composition and browser runtime.

## Project files

```text
my-video/
  motion.md
  assets/         # images, fonts, audio
  style.css       # optional, linked from an HTML scene
  motion.js       # optional, referenced from an HTML scene
```

Use local assets and relative paths. Downloads should be saved into the project
before rendering. Remote resources are blocked by the renderer so fonts and
images do not silently change or hang a render. Only run HTML/JS you trust;
Motioon is a local authoring tool, not a hosted sandbox for untrusted submissions.

## Header

```yaml
---
version: 1
title: Product introduction
aspect: "16:9"             # alias: aspect_ratio; also accepts "1280x720"
width: 1280                # explicit width AND height override aspect
height: 720
fps: 30                    # positive integer, up to 120; usually 30 or 60
duration: 8                # seconds; also 8s, 8000ms, or 240f
background: "#f1eff9"
safe_area: 64              # authoring guidance, not automatic padding
theme:
  text: "#242035"
  muted: "#756d86"
  accent: "#7358b7"
  font_display: "system-ui"
  font_body: "system-ui"
assets:
  logo: ./assets/logo.svg
  music: ./assets/music.wav
  heading:
    src: ./assets/heading.woff2
    type: font
# Assets may alternatively be a list of {id, src, type} as in motion-spec.
audio:
  - src: asset:music
    at: 0                  # placement in composition, seconds
    trim: 0                # skip this much source audio
    duration: 8            # optional source trim duration
    volume: 0.5
---
```

`audio: ./assets/music.wav` is shorthand for a single track. Multiple audio tracks
are mixed with their independent offsets, trims and volume. Export pads silence
and cuts audio to the requested frame range. Declared fonts use their asset ID as
the CSS family name (e.g. `font_display: heading`).

Dimension presets: 16:9 → 1920×1080, 9:16 → 1080×1920, 1:1 → 1080×1080,
4:5 → 1080×1350, 21:9 → 2560×1080. Other ratios use a 1080px long edge.
Video export requires even dimensions; each dimension is limited to 8192px.

## Structured scenes — editable in the inspector

A complete valid scene:

````markdown
## scene: intro
```motion
duration: 3
elements:
  - id: headline
    type: text
    role: hero
    text: "A little idea.\nA lot of motion."
    x: 50%
    y: 45%
    w: 900
    font_size: 76
    color: "#242035"
    at: 0
    duration: 3
    enter: fade-up 0.6 0.1
```
````

Element IDs are unique throughout a composition. Types: `text`, `caption`,
`image`, `shape`, `html`. Text roles supply default type sizes: `hero` (72),
`sub` (28), `caption` (22), `label` (16). Override with `font_size`, `font_weight`,
`color`, `max_width`. Position `x`/`y` is the element center; numbers mean pixels,
percent strings are relative to canvas. `w`/`h` accept either. Other properties:
`opacity` (0–1), `scale`, `rotation` (degrees), `z`, `hidden`, `radius`.

- Images use `src: asset:logo` or `src: asset://logo` or a local path, and
  `fit: contain|cover`.
- Shapes use `shape: rect|circle|pill`, `fill`, `w`, `h`, `radius`.
- HTML uses YAML block text: `html: |` followed by indented HTML/SVG.
- `at` is scene-local. Omitted element duration fills the remainder of its scene.
- `enter` and `exit`: `preset duration delay easing`. Presets: `fade`, `fade-up`,
  `fade-down`, `scale-fade`, `blur-in`, `wipe-left`, `wipe-up`, `slide-left`,
  `slide-right`, `pop`, `zoom-out`, `rotate-in`, `none`. Duration and delay can
  use seconds, ms or frames. Easings: `linear`, `ease-out`, `ease-in`,
  `ease-in-out`, `expo.out`. An object with those four fields also works.
- Text can set `split: words|chars|lines` and `stagger: 0.06` to animate tokens
  independently with the chosen entrance preset. Styling also supports
  `letter_spacing`, `line_height`, `text_transform`, `text_stroke`, `shadow`, and
  `blend_mode`.
- Scene transitions: `cut`, `fade`, `wipe-left`, `wipe-up`, `slide-left`, or
  `zoom`, followed by duration. Fade is a fade-in against the
  background, not an automatic overlap/crossfade. Use explicit overlapping scenes
  for layering; later scenes paint above earlier ones.

## HTML scenes — editable in source

```markdown
## Scene: intro (0s-2s)
<style>
  @keyframes enter { from { opacity: 0; transform: translateY(20px); }
                     to { opacity: 1; transform: translateY(0); } }
  .headline { animation: enter .6s both; font: 700 64px system-ui; }
</style>
<h1 class="headline" data-motion="headline">Hello.</h1>

## Scene: product (2s-5s)
<img data-motion="product" src="asset://logo" width="200">
```

Each HTML scene fills the canvas. Native CSS animations are paused and sought at
scene-local time, including delays, fill modes and repeating animations. Styles
are document-global, so scope selectors when needed. Use `data-motion="id"` on
objects to include them in frame inspection. HTML remains HTML; the Studio does
not pretend to rewrite arbitrary scripts through property controls.

## Deterministic JavaScript

Scripts execute after the API exists and before mount. Register drawing or DOM
updates using `motion.onFrame`; initialize assets before drawing. Built-in images
and declared fonts are awaited. WebGL or custom async libraries need explicit
readiness management by the author; they are not a tested first-class V1 feature.

```html
<script>
  motion.onFrame(({ time, frame, fps, duration, progress }) => {
    document.querySelector('#headline').style.opacity = motion.sequence(0, .6, time);
  });
  motion.animate('#badge', { opacity: [0, 1], y: [30, 0], start: 1, duration: .5, ease: 'expo.out' });
</script>
```

API:

- `motion.seek(seconds)`: synchronous seek; `motion.seekAsync(seconds)` waits for
  image/font readiness. Both clamp to the last output frame.
- `motion.time`, `motion.currentTime`, `motion.frame`, `motion.fps`,
  `motion.duration`, `motion.progress`, `motion.width`, `motion.height`.
- `motion.onFrame(callback)`: register a callback; returns an unsubscribe function.
- `motion.interpolate({input, range:[0,1], output:[100,0], easing:'linear'})`:
  clamped numeric interpolation, with multiple input/output stops supported.
- `motion.ease(name, progress)`, `motion.clamp(value, min=0, max=1)`.
- `motion.sequence(start, duration, time=motion.time)`: clamped local progress.
- `motion.stagger(index, interval=.1)`: offset in seconds.
- `motion.spring({time, frequency=3, damping=8})`: analytic damped oscillation.
- `motion.animate(selector, {opacity:[0,1,.8,1], x:[0,20,0], y:[20,0], scale:[.9,1],
  rotation:[0,10], start, duration, ease})`: numeric tracks for raw HTML nodes.
  Arrays may contain any number of evenly spaced keyframes. The helper owns the
  selected node's transform; use a child wrapper if needed.
- `motion.getElements()`: semantic element bounds and canvas overflow.
- `window.__motion` is an alias for existing integrations.

Do not base exported animation on wall-clock timers, `Date.now()`, unseeded
randomness or independent requestAnimationFrame loops. An onFrame callback must
compute the full state from its arguments, not increment mutable state. Canvas
callbacks should clear and redraw. Native audio/video tags are rejected in V1;
use frontmatter audio. There is no automatic beat detection in V1.

## Export and inspection

`ceil(duration * fps)` frames are rendered, with indices 0 through N−1. Exported
duration is N/fps. `--frames 30:90` includes 30 and excludes 90. The last state is
held on playback completion. `--frames 0,30,60` for inspect means three frame
indices, not seconds.

The renderer hashes source, runtime, browser version and local project files.
Cached PNGs are reused only when that key matches; arbitrary JavaScript means
there is no speculative partial dependency invalidation. Cache lives under
`.motioon/frames/`. Remove `.motioon/frames` to clear it, or use `--no-cache`.
Parallel workers capture full-resolution PNGs; FFmpeg consumes them in frame
order. Both formats encode YUV420 video with H.264/AAC or VP9/Opus.

Reserve the `.scene`, `.el` classes and `#stage` ID for Motioon internals. Use your
own class names inside HTML scenes. Keep data-motion identifiers stable so an
agent can compare the same objects across inspected frames.
