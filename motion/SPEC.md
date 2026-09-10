# motion.md spec

A composition is one Markdown file. YAML frontmatter describes the tape. Headings describe scenes. Fenced `motion` blocks describe layers. Everything else is ignored by the compiler so agents can leave notes.

Times are seconds unless written with a unit (`240ms`, `2.4s`, `12f`). Frames use the composition `fps`.

## Frontmatter

```yaml
id: product-launch
title: Product launch
aspect: 9:16                 # 16:9 | 9:16 | 1:1 | 4:5 | 21:9 | WxH
fps: 30
duration: 12                 # optional; inferred from scenes if omitted
background: "#07070A"
safe_area: 64                # px inset for text
theme:
  accent: "#7C5CFF"
  text: "#F5F5F7"
  muted: "#A1A1AA"
  font_display: Inter
  font_body: Inter
audio: []
assets: {}
```

`assets` is a map of logical names to files or URLs. Layers reference them as `asset:logo`, never as raw paths, so the studio can rebind files without rewriting every layer.

```yaml
assets:
  logo: ./assets/logo.svg
  product: ./assets/phone.png
audio:
  - id: vo
    src: ./assets/vo.wav
    start: 0.4
  - id: bed
    src: ./assets/bed.mp3
    gain: -16
    fade_in: 0.6
    fade_out: 1.2
```

## Scenes

```markdown
## scene: hook
```motion
duration: 2.4
transition: fade 0.24
elements:
  - id: title
    type: text
    text: Your calendar, finally.
    role: hero
    enter: fade-up 0.5 0.2
    exit: fade 0.2
```
```

Rules:

- `## scene:<id>` starts a scene. `id` must be unique.
- The first fenced `motion` block under that heading is the scene body.
- Scene `duration` is required.
- Scene start is the sum of previous scene durations unless `at:` is set.
- `transition` applies at the *start* of the scene (how this scene arrives).

## Elements

Every element:

| field | default | notes |
|---|---|---|
| `id` | required | unique inside the composition |
| `type` | required | `text` `image` `shape` `html` `caption` |
| `at` | `0` | offset inside the scene, seconds |
| `duration` | scene remainder | how long it lives |
| `x` `y` | `50%` `50%` | transform origin is center |
| `w` `h` | auto | |
| `opacity` | `1` | |
| `z` | document order | |
| `enter` | none | `preset duration delay? easing?` |
| `exit` | none | same grammar |
| `easing` | `ease-out` | used when a preset does not specify one |

### text

```yaml
- id: title
  type: text
  text: Your calendar, finally.
  role: hero          # hero | sub | caption | label
  align: center
  color: theme.text
  max_width: 80%
```

### image

```yaml
- id: hero
  type: image
  src: asset:product
  fit: contain        # contain | cover
  radius: 24
```

### shape

```yaml
- id: plate
  type: shape
  shape: rect         # rect | circle | pill
  fill: "#111118"
  w: 90%
  h: 28%
  radius: 28
```

### html

Escape hatch. Must still be seekable — no `setTimeout` walls, no unpaused CSS that the runtime cannot scrub.

```yaml
- id: chart
  type: html
  html: |
    <div class="bars">...</div>
```

## Motion presets

Presets compile to CSS + WAAPI so the renderer can set `animation.currentTime`.

| preset | what it does |
|---|---|
| `fade` | opacity 0 → 1 |
| `fade-up` | fade + 24px rise |
| `fade-down` | fade + 24px drop |
| `scale-fade` | fade + 0.92 → 1 |
| `blur-in` | fade + blur 12px → 0 |
| `wipe-left` | clip-path reveal |
| `none` | cut |

Grammar:

```
<preset> <duration> <delay?> <easing?>
fade-up 0.5 0.2 ease-out
```

Or mapping form:

```yaml
enter:
  preset: fade-up
  duration: 0.5
  delay: 0.2
  easing: ease-out
```

## Transitions between scenes

`fade`, `cut`, `slide-left`, `slide-up`, `zoom`. Duration is the overlap window. During overlap both scenes are mounted and the outgoing scene plays its exit.

## Seek contract

Compiled HTML must expose:

```js
window.__motion = {
  version: 1,
  width, height, fps, duration,
  seek(seconds) { /* paint that instant, sync */ },
  async seekAsync(seconds) { /* seek + fonts/images ready */ }
}
```

Rules the compiler enforces:

1. No wall-clock animation. `requestAnimationFrame` and CSS `animation-play-state` are owned by the runtime.
2. Media elements (`<video>`, `<audio>`) are seeked to `t - start`, never played.
3. Same `seek(t)` must paint the same pixels.

That is the only thing a renderer is allowed to depend on.

## Validation errors

The linter fails the file when:

- two elements share an `id`
- a scene has no duration
- an `asset:` reference is missing
- a time range sticks out past composition duration
- `aspect` is unknown and no `width`/`height` given
- an `html` element contains `setInterval(` or `setTimeout(` (warn in v0, error later)

## Example

See `examples/product-launch/motion.md`.
