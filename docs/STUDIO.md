# Studio

Studio is the local editor for a `motion.md` project. Start it with:

```sh
node bin/motion.mjs studio path/to/motion.md --port 4400
```

The interface opens in dark mode with shadcn preset
[`b51pyaag6`](https://ui.shadcn.com/create?preset=b51pyaag6): Rhea styling,
neutral surfaces, a lime primary color, medium radius, and Geist. The preset's
generated semantic color variables are in `packages/studio/preset.css`. Studio
components and the font are bundled locally; opening a project does not need a
design-system CDN. The preview keeps each video's own colors and dimensions.

## Edit a project

- Select a scene or structured layer on the left, then change its properties in
  the Inspector. **Save adjustments** updates `motion.md`.
- **Move on canvas** lets you drag a structured layer in the preview. It saves
  the resulting position to the source. HTML-authored scenes remain editable
  through **Edit source**.
- In the source editor, tap a highlighted color or value to inspect and change
  it. **Apply value** updates the editor text; **Save source** writes the file.
- Scrub the timeline or use the frame buttons to inspect exact video times.
  The Sound cues panel auditions individual cues.
- **Export video** offers the version with sound, the silent version, or both.

Studio checks source revisions before writing so an external edit is not
silently overwritten. The source file and project assets stay on your machine.
See [architecture](ARCHITECTURE.md) for the shared render pipeline.

## Develop the interface

The React shell and source components live in `packages/studio/`. Editor
behavior is in `studio.js`, preview behavior is in `packages/runtime/runtime.js`,
and the loopback project server is in `packages/server/project.mjs`. Run:

```sh
npm run format:check
node --test test/studio-shell.test.mjs test/source-tools.test.mjs
node --test test/studio-canvas.e2e.mjs test/sound-panel.e2e.mjs
```

The browser tests need Chromium (`npm run setup`) and permission to listen on a
local port.
