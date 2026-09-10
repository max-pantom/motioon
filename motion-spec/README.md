# motion-spec

Parser and validator for **motion.md** — a plain-text spec that lets a model
(or a human) describe an HTML-based video: aspect ratio, duration, assets,
and a timeline of scenes. This package turns a `motion.md` string into a
structured `MotionDoc` that a renderer can consume, catching structural
mistakes (bad time ranges, unknown asset refs) before anything is rendered.

## The format

```markdown
---
title: Product Teaser
aspect_ratio: "9:16"
duration: 6.5s
fps: 30
background: "#0a0a0a"
assets:
  - id: logo
    src: ./assets/logo.png
  - id: vo
    src: ./assets/vo.mp3
---

## Scene: intro (0s-2s)
<div class="title" style="opacity:0; animation: fadeIn 1s ease forwards;">
  <img src="asset://logo" width="200" />
  <h1>Hello World</h1>
</div>

## Scene: reveal (2s-6.5s)
<div class="reveal">
  <p>This is the payoff.</p>
</div>
```

### Frontmatter

| field           | required | notes                                                                 |
|-----------------|----------|------------------------------------------------------------------------|
| `title`         | no       | metadata only                                                          |
| `aspect_ratio`  | yes      | `"16:9"`, `"9:16"`, `"1:1"`, `"4:5"`, `"21:9"` (presets) or explicit `"1920x1080"` pixel size |
| `duration`      | yes      | e.g. `"6.5s"`                                                           |
| `fps`           | no       | default `30`                                                           |
| `background`    | no       | default `"#000000"`                                                    |
| `assets`        | no       | list of `{ id, src, type? }`; referenced in HTML via `asset://<id>`    |

Aspect ratio presets resolve to a concrete pixel resolution (`9:16` →
`1080x1920`); non-preset ratios fall back to a 1080-long-edge default.

### Scenes

Each `## Scene: <name> (<start>-<end>)` heading opens a scene; everything
until the next heading is that scene's raw HTML. Times are always `<number>s`
(e.g. `0s`, `1.5s`). Scene names must be unique. Asset references inside a
scene's HTML use `asset://<id>` and must match a declared asset — unknown
refs are a hard parse error.

### Errors vs. warnings

`parseMotion()` throws `MotionParseError` for anything that would produce a
broken render: malformed frontmatter, invalid time strings, a scene ending
after the document's `duration`, `end <= start`, duplicate scene names, or an
`asset://` reference to an undeclared asset.

Everything else comes back as a `warnings: string[]` array instead of
throwing, since these are often intentional: overlapping scenes (layered
compositing), gaps between scenes, a trailing gap before `duration`, or a
declared-but-unused asset (e.g. an audio asset consumed by the renderer's
mix rather than referenced in HTML).

## Usage

```ts
import { parseMotion, MotionParseError } from "motion-spec";
import { readFileSync } from "node:fs";

const source = readFileSync("teaser.motion.md", "utf-8");

try {
  const { doc, warnings } = parseMotion(source);
  // doc.resolution      -> { width: 1080, height: 1920 }
  // doc.duration         -> 6.5
  // doc.scenes[0].html   -> the raw HTML fragment for that scene
  // doc.scenes[0].referencedAssets -> ["logo"]
  warnings.forEach((w) => console.warn("[motion.md]", w));
} catch (e) {
  if (e instanceof MotionParseError) {
    console.error("Invalid motion.md:", e.message);
  } else {
    throw e;
  }
}
```

## Design notes for what's next

- **Renderer**: consumes `MotionDoc`, drives a virtual clock inside headless
  Chromium (patched `performance.now()` / `requestAnimationFrame`), steps
  frame-by-frame across scenes by wall-clock-independent ticks, screenshots
  each frame, and stitches with ffmpeg. This is what makes it fast — render
  time is decoupled from playback duration.
- **MCP server**: should expose `get_spec_schema` (so a model can fetch this
  same schema programmatically), `validate_motion` (wraps `parseMotion`),
  `render_preview`, and `render_video`.
- **Studio**: a scrubber UI over the same renderer, so what's previewed is
  pixel-identical to the final render rather than an approximation.

## Scripts

```
npm run build       # compile to dist/
npm run typecheck    # tsc --noEmit
npm test             # run the smoke test suite
```
