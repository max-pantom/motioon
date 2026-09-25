# Studio

Studio is the local editor for a `motion.md` project. Start it with:

```sh
node bin/motion.mjs studio path/to/motion.md --port 4400
```

The interface opens in dark mode with Sunset's visual language: a `#1d1d1f`
canvas, `#2c2c2c` surfaces, Inter, white primary actions, and blue focus. The
shadcn [`b51pyaag6`](https://ui.shadcn.com/create?preset=b51pyaag6) preset
remains the component base layer in `packages/studio/preset.css`;
`packages/studio/sunset-theme.css` applies Sunset's tokens to the editor.
Components and fonts are bundled locally. The preview keeps each video's own
colors and dimensions. See the [Studio design rules](studio-design.md).

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
