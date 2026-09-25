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
aspect: "16:9" # alias: aspect_ratio; also accepts "1280x720"
width: 1280 # explicit width AND height override aspect
height: 720
fps: 30 # positive integer, up to 120; usually 30 or 60
duration: 8 # seconds; also 8s, 8000ms, or 240f
background: "#f1eff9"
safe_area: 64 # authoring guidance, not automatic padding
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
    at: 0 # placement in composition, seconds
    trim: 0 # skip this much source audio
    duration: 8 # optional source trim duration
    volume: 0.5
---
```

Audio can also be authored as a cue sheet. `kind` controls mixer behavior,
`at` accepts one time or a list of one-shot times, and the master is normalized
during `render`:

```yaml
audio:
  master: {lufs: -16, peak: -1.5, sample_rate: 48000}
  tracks:
    - {id: bed, kind: music, src: ./audio/bed.wav, start: 0, end: 8, gain_db: -22, fade_in: 0.6, fade_out: 1.4, duck_under: [vo]}
    - {id: vo, kind: voice, src: ./audio/vo.wav, start: 1.5}
    - {id: tick, kind: sting, src: ./audio/tick.wav, at: [0, 1.2, 4], gain_db: -16, oneshot: true}
```

Kinds are `voice`, `music`, `sting`, `whoosh`, and `room`. Music is side-chain
ducked when voice exists. Stings less than 80ms apart fail validation; music
above -16dB with voice also fails. The `openai` recipe additionally rejects
whooshes.

`audio: ./assets/music.wav` is shorthand for a single track. Multiple audio tracks
are mixed with their independent offsets, trims and volume. Export pads silence
and cuts audio to the requested frame range. Declared fonts use their asset ID as
the CSS family name (e.g. `font_display: heading`).

Brand constraints can be stored with the composition. `brand.logoLockup`
records the source UI proportions; a `brand-lockup` layer scales the mark, gap
and wordmark together from its `font_size`. `brand.typeScale`, `brand.spacing`,
and `brand.radius` remain reviewable constraints for agents authoring components.

```yaml
brand:
  accent: "#0071E3"
  typeScale: {hero: 178, title: 54, body: 42}
  spacing: [4, 8, 12, 16, 24, 32]
  radius: 20
  logoLockup:
    mark: asset:mark
    wordmark: Sunset
    markWidth: 28
    markHeight: 26
    fontSize: 24
    fontWeight: 500
    gap: 8
    tracking: "-0.035em"
```

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
`image`, `svg`, `shape`, `html`, `group`, `brand-lockup`. Text roles supply default type sizes:
`hero` (72), `sub` (28), `caption` (22), `label` (16). Override with `font_size`,
`font_weight`, `color`, `max_width`. Position `x`/`y` is the element center;
numbers mean pixels, percent strings are relative to canvas. `w`/`h` accept
either. Other properties: `opacity` (0–1), `scale`, `rotation` (degrees), `blur`
(px, static), `z`, `hidden`, `radius`.

- Images use `src: asset:logo` or `src: asset://logo` or a local path, and
  `fit: contain|cover`.
- Shapes use `shape: rect|circle|pill`, `fill`, `w`, `h`, `radius`.
- SVG (`type: svg`) holds raw inline SVG in a `svg:` block; shapes animate with
  the `draw` preset. Width/height are inherited from `w`/`h`.
- Groups (`type: group`) hold other elements in a `children:` list. The group is
  a full-canvas container: a group-level `opacity`, `scale`, `rotation` or
  entrance transform applies to everything inside, and child elements keep
  their own position and animation. Child IDs must be unique across the whole
  composition.
- HTML uses YAML block text: `html: |` followed by indented HTML/SVG.
- `at` is scene-local. Omitted element duration fills the remainder of its scene.
- `enter` and `exit`: `preset duration delay easing`. Presets: `fade`, `fade-up`,
  `fade-down`, `scale-fade`, `blur-in`, `wipe-left`, `wipe-up`, `slide-left`,
  `slide-right`, `pop`, `zoom-out`, `rotate-in`, `reveal`, `type`, `draw`,
  `none`. Duration and delay can use seconds, ms or frames. Easings: `linear`,
  `ease-out`, `ease-in`, `ease-in-out`, `expo.out`, `spring`, or
  `spring(frequency, damping)` (an analytic overshoot; quote `spring(3, 8)` in
  flow YAML). `spring.soft` and `spring.snappy` are named variants. An object
  with those four fields also works. `reveal` wipes in
  top-down, `type` reveals split characters one by one, `draw` traces SVG
  strokes via dash-offset.
- Text can set `split: words|chars|lines` and `stagger: 0.06` to animate tokens
  independently with the chosen entrance preset. Styling also supports
  `letter_spacing`, `line_height`, `text_transform`, `text_stroke`, `shadow`, and
  `blend_mode`.
- Keyframe tracks (`animate:`): animate a property from one value to another with
  its own start, duration and easing. Each property takes an object or a
  `[from, to]` pair; shared defaults are `start: 0`, `duration: 0.6`,
  `easing: ease-out`.

  ```yaml
  - id: title
    type: text
    text: Hello
    animate:
      opacity: { from: 0, to: 1, start: 0.2, duration: 0.5, easing: expo.out }
      y: [24, 0]
  ```

  Animatable properties: `opacity`, `x`, `y`, `scale`, `rotation`, `blur`.
  Tracks are relative: `x`/`y` offset the element position, `scale`/`opacity`
  multiply, `rotation`/`blur` add. Tracks combine with `enter`/`exit` presets
  and with JavaScript `motion.animate`.

### Seekable micro motion

Structured layers may carry independent `behaviors:`. The runtime samples them
from absolute time on every seek; they are effects on a layer, not new layer
types. Supported V1 types are `blur` (`blur-in`/`focus-in` aliases), `mask`
(`mask-reveal` alias), `depth`, `path` (`path-follow` alias), and `compress`.
Each accepts scene-local `at`, `duration`, and `easing`; `on: event-id` starts it
at a named event instead. `spring.soft` and `spring.snappy` are deterministic
easings. Unsupported behavior types fail validation.

```yaml
# Frontmatter: reusable cubic Bézier and a timed event.
paths:
  arc: {type: bezier, points: [[120, 500], [440, 300], [850, 310], [1160, 170]]}
events: {reveal: 1.2}
audio:
  tracks:
    - {id: click, kind: sting, src: "asset:tick.cut", at: "event:reveal"}
```

```yaml
# Inside a motion scene.
camera: {type: push, from: 1, to: 1.04, follow: cursor, strength: 0.06, lag: 120ms}
cursor:
  x: 90%
  y: 85%
  actions:
    - {type: move, at: 0, to: [50%, 50%], duration: 0.48, easing: expo.out}
    - {type: click, at: 0.48, event: reveal}
elements:
  - id: product
    type: image
    src: asset:ui.feature
    behaviors:
      - {type: mask, shape: circle, origin: cursor, from: 0, to: 140, on: reveal}
      - {type: blur, from: 18, to: 0, duration: 0.38, on: reveal}
      - {type: depth, perspective: 1200, tilt_x: -4, tilt_y: 4, react: cursor}
      - {type: compress, scale: 0.97, duration: 0.18, on: reveal}
```

Events in scene `events:` use scene-local time. A cursor click with `event:`
emits its event at the click time. Audio `at: event:id` and behavior `on: id`
resolve to that same absolute instant. Cursor `move` targets may be `[x, y]`
coordinates or a `#id` of a structured element. The runtime generates a subtle
curved path and seeks it without playing an animation. `path` behaviors accept
four inline Bézier points or `path: arc`, `from`/`to` progress and optional
`orient: tangent`. `depth` supports `tilt_x`, `tilt_y`, `float_y`, `period`,
`perspective`, and `react: cursor`. `mask` supports circle, rect and line.
For letters along a curve, set `distribution: glyphs` and `spacing: 0.035` on
a text layer with a `path` behavior. Each glyph is placed independently.

Layer `path:` is a second option for a timed route through canvas coordinates.
It works on text, images and shapes. Scene `cursor.path:` uses the same timed
points; `click: true` fires a visual click and `event:` names it for sound or
behavior synchronization.

```yaml
cursor:
  path:
    - {t: 0, x: 74%, y: 75%}
    - {t: 0.6, x: 52%, y: 51%, ease: expo-out, click: true, event: field-click}
elements:
  - id: headline
    type: text
    text: LIVE
    enter: fade-blur 0.55 0.28
    path:
      - {t: 0, x: 12%, y: 38%}
      - {t: 1.1, x: 18%, y: 28%, ease: expo-out}
  - id: input
    type: text
    text: Q4 plan
    typewriter: {cps: 10, from: 0.15, caret: true}
```

`typewriter` reveals characters at a seekable rate; the caret appears only
while typing and can use `caret_color`. The scene cursor click ring can use
`click_color`. Both default to `brand.accent` when it exists. `fade-blur` and
`tilt-in` are entrance presets. Manual
`keyframes.rotateX` and `keyframes.rotateY` accept ordered `{t, v, ease}`
points in degrees, alongside opacity, position, scale, rotation and blur.
A scene camera accepts `camera: {from: 1, to: 1.04, anchor: [52%, 48%]}`;
`type: push` is implicit. The editable [eight-second example](examples/banger-8s/motion.md)
uses all of these on the regular runtime.

Every video render writes the requested file with an audio stream and a sibling
`*.silent.mp4` or `*.silent.webm` with no audio stream. When `motion.md` has no
audio cues, the first file contains a silent audio stream; Motioon does not
invent sound. Studio presents both downloads.

- `count:` turns a text element into a rising number. Fields: `to`, `from?`,
  `start?`, `duration?`, `easing?`, `prefix?`, `suffix?`, `decimals?`,
  `thousands?`. The default writes thousands separators and no decimals (e.g.
  `$2,400`). Do not combine `count` with `split`.
- `replace:` swaps a text element's content at fixed local times. Accepts a
  single `{at, text}` or a list, sorted automatically. Do not combine with
  `split` or `count`.
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
    document.querySelector("#headline").style.opacity = motion.sequence(
      0,
      0.6,
      time,
    );
  });
  motion.animate("#badge", {
    opacity: [0, 1],
    y: [30, 0],
    start: 1,
    duration: 0.5,
    ease: "expo.out",
  });
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
indices, not seconds. `motion frame <index>` (or `motioon frame <file> <index>`)
writes one exact PNG frame to `-o`, useful for fast iteration between renders.

The renderer hashes source, runtime, browser version and local project files.
Cached PNGs are reused only when that key matches; arbitrary JavaScript means
there is no speculative partial dependency invalidation. Cache lives under
`.motioon/frames/`. Remove `.motioon/frames` to clear it, or use `--no-cache`.
Parallel workers capture full-resolution PNGs; FFmpeg consumes them in frame
order. Both formats encode YUV420 video with H.264/AAC or VP9/Opus.

Reserve the `.scene`, `.el` classes and `#stage` ID for Motioon internals. Use your
own class names inside HTML scenes. Keep data-motion identifiers stable so an
agent can compare the same objects across inspected frames.
