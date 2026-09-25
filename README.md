# Motioon

Editable HTML videos, built for coding agents. Describe a video in `motion.md`,
author it with HTML/CSS/SVG or structured layers, inspect exact frames, adjust it
in Studio, and export MP4 or WebM locally.

The combined implementation lives **at this repository root**. The supplied
`motion/` and `motion-spec/` folders are preserved as reference implementations.
[The evaluation](docs/EVALUATION.md) explains what was kept, replaced, and tested.

## Start

Requires Node.js 22+ and a platform supported by Playwright and ffmpeg-static.

```sh
npm install
npm run setup
npm run dev
```

Open **http://127.0.0.1:4400**. Studio opens in dark mode with the Sunset
interface language: compact neutral chrome, Inter type, white actions, and blue
focus. It keeps locally bundled shadcn-style source components and the
`b51pyaag6` preset as a base layer. The
sample project has three scenes, selectable
layers, property editing, playback, frame scrubbing, source editing, undo/redo,
assets, and local video export. The source editor highlights keys and colors;
its quick-edit panel changes the selected value without rewriting the scene.
Turn on **Move on canvas** to drag a structured layer directly in the preview;
the new position saves to `motion.md`.
Edits save to `examples/product-launch/motion.md`.
See the [Studio guide](docs/STUDIO.md) for editing, export, and theme details.

To create your own project:

```sh
node bin/motion.mjs new ./my-video
node bin/motion.mjs studio ./my-video/motion.md
node bin/motion.mjs validate ./my-video/motion.md
node bin/motion.mjs inspect ./my-video/motion.md --frames 0,36,120,239
node bin/motion.mjs frame ./my-video/motion.md 120 -o frame-120.png
node bin/motion.mjs render ./my-video/motion.md -o ./my-video/video.mp4
```

For a reference-guided launch piece, set `recipe: openai-launch` in frontmatter,
use `catalog: ./assets/catalog.json`, and include a real UI image or WebM layer.
The six local reference shot sheets are in
[`references/openai-launch/`](references/openai-launch/README.md). Card palette,
hard cuts, holds, product footage and cut cues are checked by `motion score`.
The recipe limits card colors; UI inserts may retain their product colors.

```sh
node bin/motion.mjs score ./my-video/motion.md
node bin/motion.mjs sound synth ./my-video/motion.md
node bin/motion.mjs capture ./my-video/motion.md --url http://127.0.0.1:3000 --seconds 3 --id ui.demo
node bin/motion.mjs test gold/openai-8s
node bin/motion.mjs test gold/project-capture
node bin/motion.mjs test gold/micro-motion-8s
node bin/motion.mjs test gold/openai-8s --review
```

`capture` records a real browser interaction to a cataloged WebM. Pass
`--flow flow.json` for steps such as `{"click":"#start"}`, `{"wait":500}`,
`{"type":{"selector":"#prompt","text":"Hello"}}`, or
`{"press":"Enter"}`. The gold command renders an 8-second film, compares
normalized description, cue sheet and five PNG frames, and checks score and
measured audio loudness. `--review` opens the playable film beside those frames.
The second gold fixture records a real Studio interaction and seeks it as a
video layer, covering the complete capture pipeline.
The micro-motion fixture checks cursor movement and clicks, timed events,
mask/focus/depth/path/compress behaviors, and a camera push in one seekable clip.
The [It’s live example](examples/banger-8s/motion.md) uses timed cursor paths,
seekable typing, fade-blur, tilt keyframes and a camera anchor. Preview it with
`node bin/motion.mjs studio examples/banger-8s/motion.md`.
Every render now returns the requested video with an audio stream plus a
`.silent` sibling without audio. Studio's export dialog lets you choose the
sound version, silent version, or both downloads; projects without
audio cues get a silent audio stream in the first file.
The Studio sound panel uses shadcn/ui Card and Button source-component patterns
and an adapted ElevenLabs UI Waveform for cue preview.
The offline sound kit now uses short, damped percussion-like edit cues. Run
`sound synth` without flags to fill missing files, or add `--force` to replace
the four generated `tick.*` files in a project. Its WAV files stay editable in
`assets/audio/`; audition the export, since loudness checks cannot judge timbre.

Use `npm link` if you want the `motioon` and `motion` commands available globally.
Global installation is optional; it is not performed by setup.

## Write videos

Author films by hand, with an agent, or programmatically. Two assistant
packages exist: `@motioon/motion` (packages/motion) emits `motion.md` from
`film()`/`scene()` builders, `enter.*` entrance presets, `tween`/`countUp`/
`swap` and a Markdown serializer (see `examples/motioon-launch/build.mjs`); the
motion.dev `motion` package powers the Studio UI (progress tween, completion
pop). See [the bundled skills index](skills/SKILLS.md) for the authoring skills.
Run `motioon skills` for their installed paths, or `motioon agent` for a machine
readable skill list and MCP configuration. The router selects just the skills
needed for an edit; [SPEC.md](SPEC.md) defines what the runtime supports.

The [format and runtime reference](SPEC.md) documents both supported scene formats:

- **Structured scenes**: YAML layers inside a `motion` fence. Studio can edit
  text, font size, color, position, size, scale, rotation, opacity, visibility,
  scene/element timing and entrance animation settings. Layers include `text`,
  `caption`, `image`, `video`, `svg`, `shape`, `html` and nested groups (`group` with
  `children`). Motion lives in the file: `enter`/`exit` presets, per-property
  keyframe tracks (`animate:` with `from`/`to`/`start`/`duration`/`easing`),
  rising counters (`count:`), mid-scene text swaps (`replace:`), typewriter
  reveals (`enter: type`), SVG stroke draws (`enter: draw`), and spring easing
  (`spring` or `spring(frequency, damping)`).
- **HTML scenes**: `## Scene: intro (0s-2s)` followed by HTML, CSS, SVG and scripts.
  Native CSS animations are explicitly paused and sought. Use `motion.onFrame`
  for custom deterministic drawing. Edit these scenes in the source editor.

The brief remains in the markdown. Property edits rewrite only the affected YAML
fence, preserving surrounding prose and scenes. Saves validate before replacing
the file, and revision checks prevent overwriting external changes.

Examples: [structured product launch](examples/product-launch/motion.md),
[raw HTML and CSS](examples/html-scenes/motion.md),
[kinetic typography showcase](examples/kinetic-showcase/motion.md), and the
[Sunset acceptance film](examples/sunset-launch/motion.md) — an 8-second, 4:5,
60 fps launch video that exercises groups, keyframe tracks, a $2,400 counter, a
typewriter reveal and an SVG stroke draw.

## Connect an AI agent

```sh
node bin/motion.mjs agent
```

This prints the absolute skill path and MCP connection configuration. Example:

```json
{
  "mcpServers": {
    "motioon": {
      "command": "node",
      "args": ["/absolute/path/to/motioon/packages/mcp/server.mjs"]
    }
  }
}
```

Use [the bundled skill](skills/motion/SKILL.md) from your agent's skill loader, or
read it directly. No account or API key is needed for Motioon itself; the connected
agent provides the language model. This build does not contain a pretend AI chat
box or require a specific model provider.

MCP editor tools (the only authoring surface): `motion_editor_state`,
`motion_editor_schema`, `motion_editor_run`, `motion_editor_batch`. Every edit is
a named op — `set`, `keyframe`, `deleteKeyframe`, `move`, `trim`, `reorder`,
`enable`, `lock`, `parent`, `addLayer`, `duplicate`, `remove`, `addScene`,
`setScene`, `removeScene` — applied in one step, written straight to `motion.md`,
and undoable with `{op:"undo"}`. A `motion_editor_batch` runs in one session and
is a single undo unit (one snapshot for the whole sequence). Pipeline tools
outside the editor:
`motion_init`, `motion_read_spec`, `motion_validate`, `motion_compile`,
`motion_inspect_frames`, `motion_render`.

Frame inspection returns actual PNG image content, plus semantic element bounds
and visible overflow. MCP uses the official TypeScript SDK's stdio transport and
standard tool results. All tools operate on local files under the requesting
agent's authorization.

## Rendering

```sh
node bin/motion.mjs render ./my-video/motion.md -o video.mp4 --workers 2
node bin/motion.mjs render ./my-video/motion.md -o video.webm --quality draft
node bin/motion.mjs render ./my-video/motion.md -o segment.mp4 --frames 30:90
node bin/motion.mjs compile ./my-video/motion.md -o ./my-video/dist
```

Frame ranges are zero-based, end-exclusive. Chromium captures full-resolution
frames; FFmpeg encodes H.264/AAC or VP9/Opus. Audio tracks support placement,
source trimming, volume and mixing. Source and local file hashes make repeated
renders reuse captured PNGs. `--no-cache` recaptures frames. Delete a project's
`.motioon/frames/` directory to reclaim cache space.

Compiled output includes local project files needed by relative HTML/CSS asset
references. `composition.html` is the seekable composition, not the editor.
Studio runs through the local server so source saving and export work.

Playwright is pinned to 1.55.1 for compatibility with this development Mac. If
browser download is slow, set `PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=120000`
when running `npm run setup`. To use an explicitly installed compatible Chromium,
set `MOTIOON_CHROMIUM` to its executable. `MOTIOON_FFMPEG` overrides the bundled
FFmpeg executable. Browser/FFmpeg binaries have their own platform support and
licenses; review those before distributing a packaged binary application.

## Verification

```sh
npm test          # parsing, both original formats, persistence, file serving
npm run test:e2e  # actual Chromium, FFmpeg, Studio and MCP client workflows
npm run check
```

The browser suite seeks backward and compares PNG hashes, decodes exported MP4
and WebM to count frames, verifies audio, checks cache reuse/invalidation, edits
and undoes Studio changes, downloads an export, tests mobile reflow, and calls
MCP tools through an actual client.

## V1 boundaries

This is a working local V1. It supports HTML, CSS, SVG, local images/fonts,
cataloged seekable WebM clips, deterministic JS, audio, and MP4/WebM export.
It intentionally leaves out automatic beat analysis, arbitrary JavaScript reverse engineering, cloud
rendering, collaboration, and an integrated LLM provider. Canvas can be authored
through `onFrame`; WebGL/3D libraries and custom async assets need author-managed
readiness and have not been validated as first-class features.

Determinism requires time-driven authoring; arbitrary scripts using timers,
network, or unseeded randomness cannot be made reproducible by screenshots.
Overflow detection is geometric, not a judgment of typography or composition.
Native HTML scene styles are document-global. Safe-area settings are guidance,
not an automatic layout constraint. Fonts can differ between operating systems;
use a bundled font when exact typography matters.

Studio keeps undo history for the current session. It rejects stale writes and
leaves changes unsaved for you to reconcile if another editor modifies the file.
Source edits update on save; external edits can be loaded by refreshing Studio.
The editor previews audio through browser media elements; mix loudness above
unity and codec-specific audio may differ from FFmpeg export.

## Layout

```text
packages/core       Parse, validate, compile, persist edits
packages/runtime    Absolute-time browser animation engine
packages/renderer   Chromium capture, cache, FFmpeg encoding
packages/server     Loopback project and Studio API
packages/studio     Dark local editing interface
packages/cli        CLI commands and project creation
packages/mcp        Agent tools and stdio server
skills               Bundled agent authoring and craft skills
examples            Working structured and HTML projects
```
