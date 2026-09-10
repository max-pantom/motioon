---
name: motion
description: Create and edit HTML videos in Motioon using motion.md, the deterministic runtime, frame inspection, and local export. Use for Motioon projects or when asked to generate editable HTML-based video with the Motioon CLI or MCP.
---

# Motioon video authoring

Read [the format reference](references/spec-short.md) for project syntax and
runtime constraints. The installed CLI is `motioon` (alias `motion`); within this
repository use `node bin/motion.mjs`. `motioon agent` prints the installed skill
path and a ready-to-use MCP server configuration.

The source of truth is `motion.md`, including the creative brief. Structured
scenes support Studio property editing. Timed HTML scenes support unrestricted
HTML/CSS/SVG and deterministic JavaScript, edited through source. Choose the
format that fits the shot; do not force complex designs into primitive shapes.

A useful loop:

1. Create a project with `motioon new <dir>` or read the existing motion.md.
2. Set dimensions, frame rate and duration from the user's brief. Add local
   assets, then write the scenes. Preserve existing creative direction when editing.
3. Validate with `motioon validate <file>` or `motion_validate`.
4. Inspect representative opening, transition, middle and closing frame indices
   with `motioon inspect <file> --frames 0,30,60` or `motion_inspect_frames`.
   Open the returned images: JSON bounds alone cannot establish visual quality.
5. Fix clipped text, poor hierarchy, misplaced images and awkward transitions.
6. Render with `motioon render <file> -o <output.mp4>`. The final CLI JSON includes
   exact dimensions, frames, cache hits and elapsed time. Verify the output exists.
7. Return the file path and, if human adjustments are useful, the Studio URL from
   `motioon studio <file>` or `motion_preview`.

Frame arguments are zero-based indices. A render range is end-exclusive; inspect
accepts a list. Place assets inside the project, reference them by relative path
or declared asset ID, and use local fonts for reproducibility. Network resources
are blocked during render. Audio belongs in frontmatter tracks; embedded video
and audio elements are outside V1 scope.

Use CSS animations or `motion.onFrame`/`motion.animate` for motion. Compute state
from absolute time, not wall-clock timers or incremental state. Keep readable
text within the canvas and allow entrance motion to settle before a cut. The
Studio updates structured properties directly in the markdown; `motion_patch`
does the same, without unused sidecars. Raw HTML is edited as source.

For kinetic typography, use `split: words|chars|lines` with a small `stagger`
(usually 0.035–0.09 seconds). Combine it with `slide-left`, `rotate-in`, `pop`,
or `blur-in`. Use `wipe-up`, `slide-left`, or `zoom` scene transitions with
restraint. Multi-stop arrays in `motion.animate` support overshoot and settle.

The engine exports MP4 and WebM, not generative footage. It does not invoke an LLM
itself: the connected coding agent writes the composition. Do not claim automatic
beat detection, cloud rendering, video compositing, or partial dependency caching.
