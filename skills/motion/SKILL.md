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
4. For **any authoring change** — text, time, position — use the command bus:
   `motion_editor_state {file}` to read the tape (scenes with absolute
   start/duration, layers with absolute start/duration and x/y/opacity/rotation/
   scale, enabled, locked), `motion_editor_run {file, op, ...}` for one named op,
   or `motion_editor_batch {file, commands:[...]}` for a sequence. Every document
   op is a single named `apply` step that writes `motion.md`; every op is
   undoable with `{op:"undo"}` (snapshot + write). Read `motion_editor_schema {}`
   before guessing an op signature. Ops: set (text/x/y/opacity/rotation/scale/
   fill/role/src/…), keyframe, deleteKeyframe, move, trim, reorder, enable, lock,
   parent, addLayer, duplicate, remove, addScene, setScene, removeScene.
5. Inspect representative opening, transition, middle and closing frame indices
   with `motioon inspect <file> --frames 0,30,60` or `motion_inspect_frames`.
   Open the returned images: JSON bounds alone cannot establish visual quality.
6. Fix clipped text, poor hierarchy, misplaced images and awkward transitions
   through the bus (never by hand-editing prose-heavy markdown).
7. Render with `motioon render <file> -o <output.mp4>`. The final CLI JSON includes
   exact dimensions, frames, cache hits and elapsed time. Verify the output exists.
8. Return the file path and, if human adjustments are useful, the Studio URL from
   `motioon studio <file>`.

Frame arguments are zero-based indices. A render range is end-exclusive; inspect
accepts a list. Place assets inside the project, reference them by relative path
or declared asset ID, and use local fonts for reproducibility. Network resources
are blocked during render. Audio belongs in frontmatter tracks; embedded video
and audio elements are outside V1 scope.

Use CSS animations, `motion.onFrame`/`motion.animate`, or the file-format
`animate:` keyframe tracks for motion. Compute state from absolute time, not
wall-clock timers or incremental state. Keep readable text within the canvas and
allow entrance motion to settle before a cut. The editor MCP surface is exactly
four tools — state, schema, run, batch — and every control is a named op that
applies in one step and writes `motion.md` directly; there is no side-channel
"write/describe" API and never a second AI agent editing around the bus. Ops
that map cleanly to the file (set, keyframe, move, trim, addLayer, duplicate,
remove, reorder, addScene, setScene, removeScene, parent) persist in place and
preserve all prose and raw HTML scenes; `enabled` persists as `hidden`,
`locked` is session state. Raw HTML is edited as source.

For kinetic typography, use `split: words|chars|lines` with a small `stagger`
(usually 0.035–0.09 seconds), or `enter: type` for a typewriter reveal. Combine
either with `slide-left`, `rotate-in`, `pop`, or `blur-in`. Use `wipe-up`,
`slide-left`, `reveal`, or `zoom` scene and element motion with restraint. SVG
strokes can be traced with `enter: draw`, counters with `count: {to, prefix}`,
and multi-stop arrays in `motion.animate` support overshoot and settle.

All `start` (animate, count, replace) and `delay` (entries) values are
scene-local seconds, relative to the scene's own start, not the film clock. When
cutting across scenes, offset every beat by the accumulated scene starts.

You can author programmatically: `@motioon/motion` (packages/motion) builds
`motion.md` from `film()` + element/scene builders, `enter.*` entrance presets,
and `tween()`/`countUp()`/`swap()` helpers; `f.md()` emits the source. See
`examples/motioon-launch/build.mjs`. Accepted launch films to study and match
pacing from: `examples/sunset-launch`, `examples/ember-launch`,
`examples/motioon-launch`.

## Launch-film recipe

A launch video reads as a banger when the silence is as deliberate as the
motion. Use this four-beat rhythm, then cover the basics before embellishing:

1. Open — one confident element (wordmark or mark) at 0.0s, settling fast
   (≈ 0.5–0.9s) so the film starts clean, not tentative.
2. Statement — the single big idea in huge type. Type it in (`enter: type`,
   1.2–1.8s) or fade it up; one quiet accent (a drawn rule, a glow) is enough.
   Hold so it lands.
3. Showcase — the proof: a card, stats (`count:`) or a product surface. One
   entry wave (staggered ≤ 0.9s each), one spring accent max. Numbers count up
   with `expo.out`.
4. End — the call-to-action line and a long hold. The last frame must feel
   finished before the loop/cut; never exit on a spring still wobbling.

Constraints that keep it banger-adjacent: one focal movement per scene, one
easing family (usually `expo.out`), reads ≤ 12s, runs only forward, and never
cuts into a moving entrance — settle first, then cut.

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
  `motioon validate` then `motioon inspect <file> --frames a,b,c` on the first,
  middle and last frame of every scene before touching the next scene.
- Keep text within safe bounds (respect `safe_area`, centered short lines for
  hero text) and never allow accidental overlaps (`motion_inspect_frames`
  reports per-element overflow).
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
