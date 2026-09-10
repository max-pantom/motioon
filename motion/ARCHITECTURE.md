# Architecture

Four surfaces, one spec.

```
                    ┌──────── skill / MCP ────────┐
                    │  write / lint / patch spec  │
                    └─────────────┬───────────────┘
                                  ▼
                             motion.md
                                  │
                     ┌────────────┼────────────┐
                     ▼            ▼            ▼
                 compiler     studio       (humans)
                     │            │
                     ▼            ▼
              composition.html + player
                     │
                     ▼
           renderer (Chromium clock)
                     │
                     ▼
              ffmpeg encode + mix
                     │
                     ▼
                    mp4
```

## 1. Skill

Path: `skills/motion/SKILL.md`

Loaded when a model is asked to make a video, motion graphic, short, explainer, or launch clip out of HTML.

The skill tells the model:

- write `motion.md`, not raw Chromium HTML
- keep motion seekable
- run `motion lint` before `motion render`
- prefer presets over custom keyframes
- treat the studio as a human loop, not a required step

Do not put the full spec in the skill body. Link `SPEC.md` and load it on demand.

## 2. MCP

Stdio server in `packages/mcp/server.mjs`.

| tool | purpose |
|---|---|
| `motion_init` | scaffold a folder with `motion.md` + assets dir |
| `motion_validate` | parse + lint, return errors/warnings |
| `motion_compile` | emit `composition.html` |
| `motion_preview` | start the local studio, return URL |
| `motion_render` | kick a render job (draft \| high) |
| `motion_patch` | apply a structured edit to a scene or element |
| `motion_describe` | dump the parsed timeline as JSON for the model |

Design rules:

- Tools take **paths and structured patches**, not 4k-token HTML blobs.
- `motion_describe` is the model's eyes. It returns scene table + element table, not pixels.
- `motion_render` is async-shaped even in v0 so a later job queue does not break clients.
- Never ask the model to base64 a finished mp4 back through MCP. Return a file path.

## 3. CLI

```
motion init <dir>
motion lint <file>
motion compile <file> -o <dir>
motion preview <file> [--port 4400]
motion render <file> -o out.mp4 [--quality draft|high]
motion describe <file>
```

CLI and MCP call the same `packages/core` functions. No second parser.

## 4. Compiler

`parse(markdown) → Composition`

`validate(composition) → Diagnostics`

`compile(composition) → { html, css, runtime, audioCueSheet }`

Output is a single HTML file plus copied assets. Self-contained preview wins over a bundler. Agents can open the file.

## 5. Runtime seek protocol

Injected as `runtime.js`.

On `seek(t)`:

1. Resolve active scene(s), including transition overlap.
2. For each element, compute local time `u = t - (sceneStart + element.at)`.
3. Apply enter/exit as `animation.currentTime = u * 1000` (WAAPI) or CSS `animation-delay` + pause.
4. Seek audio/video elements to the matching timestamp, `pause()`.
5. Return only after fonts and images for that frame have loaded (`seekAsync`).

This is the contract htmlrec / HyperFrames / Helios already need. We implement a small runtime instead of depending on GSAP so the compiled file stays readable.

## 6. Renderer (to build next)

Speed comes from not recording a wall clock.

### Capture path

1. Launch a pooled `chrome-headless-shell`.
2. Set viewport to composition size. Device scale factor 1 for draft, 2 only when asked.
3. Wait for `window.__motion`.
4. For each frame `i` in `[0, fps * duration)`:
   - `await page.evaluate(t => window.__motion.seekAsync(t), i / fps)`
   - capture via `HeadlessExperimental.beginFrame` when available
   - fallback: `Page.captureScreenshot` with `optimizeForSpeed` in draft
5. Pipe raw frames (`png` or `jpeg` draft) to ffmpeg stdin.
6. Mix audio from the cue sheet in the same ffmpeg graph.

### Virtual time backup

If a composition uses native CSS that is not wired through `__motion`, drive `Emulation.setVirtualTimePolicy` with budget `1000 / fps` ms per frame (Helios / htmlrec path). Prefer the explicit seek hook. Virtual time is the compatibility lane.

### Fast-mode tricks that actually matter

| trick | when |
|---|---|
| draft = half resolution, 15 fps, jpeg frames | iteration |
| skip byte-identical frames (holds) | titles that sit |
| chunk the timeline across N Chromes | clips > ~8s |
| keep one browser warm | MCP / studio session |
| GPU encode (`h264_videotoolbox`, `h264_nvenc`, `h264_vaapi`) | final |
| do not write PNG sequences to disk | always |
| pre-decode images in the page before frame 0 | always |

Target for a 12s 1080×1920 draft on a laptop: under 8 seconds wall time. High quality can be slower.

### Do not build

- A new animation language in JS.
- A React scene graph unless you are targeting Remotion as a backend.
- Cloud infra before the local path is deterministic.

Optional later adapter: compile `motion.md` → HyperFrames HTML (`class=clip`, `data-start`, `data-duration`) and shell out to `npx hyperframes render` for production encodes.

## 7. Studio

`motion preview` serves `packages/studio`.

Must-haves:

- Frame scrubber bound to `__motion.seek`
- Scene list + element list from `describe()`
- Live reload when `motion.md` changes
- Draft render button
- Inspector that edits one field (text, duration, enter preset) and writes a patch

Write-back format (already what `motion_patch` accepts):

```json
{
  "scene": "hook",
  "element": "title",
  "set": { "text": "A better calendar.", "enter": "fade-up 0.4 0.1" }
}
```

The markdown rewriter should only touch the matching `motion` fence. Do not pretty-print the whole file; agents hate surprise diffs.

## 8. Suggested build order

1. Spec + parser + lint + compile + preview (this repo)
2. Patch rewriter so studio / MCP can edit
3. Deterministic renderer with streamed ffmpeg
4. Audio mix
5. Chunked parallel capture
6. HyperFrames / htmlrec adapters
7. Template registry (product launch, explainer, quote card, changelog)
