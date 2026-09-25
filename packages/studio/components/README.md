# Studio source components

`button.jsx` and `card.jsx` follow the source-component model of
[shadcn/ui](https://ui.shadcn.com/). The full Studio shell now renders through
these local React components; the source, timeline, and canvas behavior stay in
the project editor runtime. `waveform.jsx` adapts the
[ElevenLabs UI Waveform](https://github.com/elevenlabs/ui/blob/main/apps/www/registry/elevenlabs-ui/ui/waveform.tsx)
for the Studio's small audio cue panel. Both upstream projects use the MIT
license. The components are bundled locally by esbuild when Studio starts; the
editor does not fetch a component CDN at runtime.

The Studio theme uses the generated semantic tokens for shadcn preset
[`b51pyaag6`](https://ui.shadcn.com/create?preset=b51pyaag6) in
`../preset.css`. Its Geist font is served from `../assets/` under the bundled
license. See [the Studio guide](../../../docs/STUDIO.md) for editor behavior.
