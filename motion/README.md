# Motion

Agent-native HTML video. One file is the source of truth: `motion.md`.

```
prompt  →  motion.md  →  composition.html  →  preview / studio / mp4
                 ↑                              │
                 └──────── studio patches ──────┘
```

Models do not invent a render farm. They write a short spec. The compiler emits seekable HTML. The renderer steps a virtual clock in Chromium and pipes frames into ffmpeg. The studio lets a human drag times and writes the change back into `motion.md`.

This is v0 of the spec + compiler + CLI + skill + MCP stub. The production renderer (BeginFrame / virtual time + chunked encode) is specified in `ARCHITECTURE.md` and intentionally not faked here.

## Why this exists

HyperFrames, Remotion, htmlrec, Helios, and ClipACanvas already solve pieces of HTML→video. What they do not share is a **small, round-trippable spec** that:

- fits in a model's context without a full CSS system
- validates before a 40-second render
- diffs cleanly in git
- can be edited in a studio and written back
- can compile to more than one engine later

`motion.md` is that spec. HTML is the compiled artifact, not the authoring format.

## Quick start

```bash
cd motion
node bin/motion.mjs init ./my-clip
node bin/motion.mjs lint ./my-clip/motion.md
node bin/motion.mjs compile ./my-clip/motion.md -o ./my-clip/dist
node bin/motion.mjs preview ./my-clip/motion.md
```

Open the printed URL. Scrub the timeline. That preview is the same document the renderer will seek.

## Repo

| Path | Role |
|---|---|
| `SPEC.md` | Language for `motion.md` |
| `ARCHITECTURE.md` | MCP, skill, CLI, renderer, studio |
| `packages/core` | Parse → validate → compile |
| `packages/runtime` | Seek protocol injected into HTML |
| `packages/cli` | `motion` commands |
| `packages/mcp` | MCP server for agents |
| `packages/studio` | Timeline UI served by `preview` |
| `skills/motion` | Agent skill |
| `examples/` | Reference compositions |

## Honest scope

**Shipped in this folder**

- Spec
- Parser + validator
- Compiler to seekable HTML
- Preview player / mini-studio
- CLI
- MCP tool schemas + stdio server
- Agent skill

**Specified, not fully built**

- Frame-accurate Chromium capture (`HeadlessExperimental.beginFrame` + virtual time)
- Parallel chunk encoding
- Audio mix of voice + bed
- GPU encoder detection
- Persistence of studio edits back into markdown (the patch format exists; the visual drag writer is stubbed)

If you already have HyperFrames or htmlrec installed, compile first, then hand `dist/composition.html` to that renderer. The seek hook is `window.__motion.seek(seconds)`.
