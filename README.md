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

Open **http://127.0.0.1:4400**. The sample project has three scenes, selectable
layers, property editing, playback, frame scrubbing, source editing, undo/redo,
assets, and local video export. It follows the supplied light Studio design.
Edits save to `examples/product-launch/motion.md`.

To create your own project:

```sh
node bin/motion.mjs new ./my-video
node bin/motion.mjs studio ./my-video/motion.md
node bin/motion.mjs validate ./my-video/motion.md
node bin/motion.mjs inspect ./my-video/motion.md --frames 0,36,120,239
node bin/motion.mjs render ./my-video/motion.md -o ./my-video/video.mp4
```

Use `npm link` if you want the `motioon` and `motion` commands available globally.
Global installation is optional; it is not performed by setup.

## Write videos

The [format and runtime reference](SPEC.md) documents both supported scene formats:

- **Structured scenes**: YAML layers inside a `motion` fence. Studio can edit
  text, font size, color, position, size, scale, rotation, opacity, visibility,
  scene/element timing and entrance animation settings.
- **HTML scenes**: `## Scene: intro (0s-2s)` followed by HTML, CSS, SVG and scripts.
  Native CSS animations are explicitly paused and sought. Use `motion.onFrame`
  for custom deterministic drawing. Edit these scenes in the source editor.

The brief remains in the markdown. Property edits rewrite only the affected YAML
fence, preserving surrounding prose and scenes. Saves validate before replacing
the file, and revision checks prevent overwriting external changes.

Examples: [structured product launch](examples/product-launch/motion.md),
[raw HTML and CSS](examples/html-scenes/motion.md), and
[kinetic typography showcase](examples/kinetic-showcase/motion.md).

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

MCP tools: `motion_init`, `motion_read_spec`, `motion_validate`, `motion_describe`,
`motion_list_assets`, `motion_compile`, `motion_patch`, `motion_inspect_frames`,
`motion_detect_overflow`, `motion_render`, `motion_preview`.

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
deterministic JS, audio, and MP4/WebM. It intentionally leaves out embedded video
clips, automatic beat analysis, arbitrary JavaScript reverse engineering, cloud
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
packages/studio     Light local editing interface
packages/cli        CLI commands and project creation
packages/mcp        Agent tools and stdio server
skills/motion       Agent authoring instructions
examples            Working structured and HTML projects
```
