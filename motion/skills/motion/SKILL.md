---
name: motion
description: Author and compile HTML videos from a motion.md spec. Use when the user wants an AI-made video, motion graphic, short, launch clip, explainer, or storyboard that should render through HTML rather than a generative video model.
---

# Motion

Write a `motion.md` file. Do not start with a raw 200-line HTML page.

## Loop

1. Decide aspect, duration, and 2–5 scenes. Keep it short on the first pass.
2. Write `motion.md` using the format in `SPEC.md`.
3. Run `node bin/motion.mjs lint path/to/motion.md`.
4. Fix errors. Warnings about timers mean the render will flicker.
5. Compile and preview. Only then talk about ffmpeg / Chromium.
6. If a human wants a tweak, patch one element. Do not regenerate the whole spec.

## motion.md rules

- Frontmatter holds `aspect`, `fps`, `duration`, `theme`, `assets`, `audio`.
- Each scene is `## scene:<id>` plus one ` ```motion ` fence.
- Elements need stable `id`s. The studio and MCP patch by id.
- Motion presets only — `fade`, `fade-up`, `fade-down`, `scale-fade`, `blur-in`, `wipe-left`.
- Images go through `assets:` and `src: asset:name`.
- No `setTimeout`, `setInterval`, or free-running CSS in `type: html` blocks.
- Times are seconds. You may write `240ms` or `12f`.

## What good looks like

- One idea per scene.
- Enter durations 0.3–0.6s. Exit shorter than enter.
- Do not stack more than 4 visible elements at once.
- Vertical video (`9:16`) puts hero text in the middle third, never the bottom 80px.
- Hold the last scene at least 2s.

## Tools

CLI from the repo root:

```
node bin/motion.mjs lint FILE
node bin/motion.mjs describe FILE
node bin/motion.mjs compile FILE -o DIR
node bin/motion.mjs preview FILE
```

MCP tools expose the same functions. Prefer `motion_describe` over dumping compiled HTML back into context.

## Renderer

The compiled page exposes `window.__motion.seek(seconds)`. That is the only capture API. If a renderer is not wired, compile and hand `dist/composition.html` to htmlrec or a HyperFrames adapter. Do not screen-record the preview player.
