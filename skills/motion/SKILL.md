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

Use CSS animations, `motion.onFrame`/`motion.animate`, or the file-format
`animate:` keyframe tracks for motion. Compute state from absolute time, not
wall-clock timers or incremental state. Keep readable text within the canvas and
allow entrance motion to settle before a cut. The Studio updates structured
properties directly in the markdown; `motion_patch`, `motion_add_scene`,
`motion_add_element`, `motion_add_animation` and `motion_add_asset` do the same,
without unused sidecars. Use `motion_write` to replace an entire `motion.md`
source atomically (e.g. a clean slate) after `motion_init`. Raw HTML is edited
as source.

For kinetic typography, use `split: words|chars|lines` with a small `stagger`
(usually 0.035–0.09 seconds), or `enter: type` for a typewriter reveal. Combine
either with `slide-left`, `rotate-in`, `pop`, or `blur-in`. Use `wipe-up`,
`slide-left`, `reveal`, or `zoom` scene and element motion with restraint. SVG
strokes can be traced with `enter: draw`, counters with `count: {to, prefix}`,
and multi-stop arrays in `motion.animate` support overshoot and settle.

## Taste

These rules make minor work look deliberate:

- Don't animate everything. Establish hierarchy before motion: per scene, pick
  one focal movement and hold everything else still.
- Use holds. Let an entrance settle for at least a beat before the next event;
  silence reads as confidence. The last frame should feel finished, not mid-flight.
- Prefer one focal movement per scene. Ambition is one idea moving well, not
  every element choreographing.
- Use easing consistently across the whole film — usually `ease-out` or
  `expo.out` everywhere. Reserve `spring(f, d)` for a single playful accent (a
  logo pop, a settle) and `ease-in` for exits only.
- Render checkpoints frequently: after each scene completes,
  `motioon validate` then `motioon frame` or inspect the first, middle and last
  frame of every scene before touching the next scene.
- Keep text within safe bounds (respect `safe_area`, centered short lines for
  hero text) and never allow accidental overlaps (`motion_detect_overflow`).
- Counters and draw effects are accents, not defaults. One counter or one draw
  per film is tasteful; several is gimmick.
- Match motion to meaning: numbers count up (expo.out), wordmarks type or draw
  in, entrances are snappy (≤ 0.9s), holds are long.
- Prefer structured scenes for most shots; drop to raw HTML scenes only when
  the geometry genuinely needs it. Reuse one easing and one entrance family so
  the film reads as one design system.

The engine exports MP4 and WebM, not generative footage. It does not invoke an LLM
itself: the connected coding agent writes the composition. Do not claim automatic
beat detection, cloud rendering, video compositing, or partial dependency caching.
