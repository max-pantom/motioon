# Studio design — Sunset adaptation

Sunset's marketplace design is the visual reference for the Studio chrome. The
video being edited remains the artwork; the editor surrounding it is quiet,
compact, and dark. Marketplace rules about project listings, search, taxonomy,
seller verification, and acquisition history do not become Studio features.

## Tokens

| Role    | Value                         | Studio use                             |
| ------- | ----------------------------- | -------------------------------------- |
| Canvas  | `#1d1d1f`                     | Page and header                        |
| Surface | `#2c2c2c`                     | Workspace panels                       |
| Hover   | `#303030`                     | Selected and interactive surfaces      |
| Control | `#2f2f2f`                     | Inputs and compact controls            |
| Media   | `#171717`                     | Composition shelf                      |
| Ink     | `#ffffff`                     | Primary text                           |
| Muted   | `rgb(255 255 255 / 0.70)`     | Metadata and controls                  |
| Soft    | `rgb(255 255 255 / 0.52)`     | Captions                               |
| Action  | `#fefefe` with `#101010` text | Primary actions and play               |
| Focus   | `#0071e3`                     | Keyboard ring, selected edge, playhead |

Use Inter from a local font file so Studio works offline. Title and section
heads use medium weight and `-0.02em` tracking. Timecodes and frame counts use
tabular numerals. Studio fields stay at least 16px on small screens to avoid
mobile zoom.

## Layout and components

- The header is 76px high. Project name stays centered; editing and export
  actions sit to the right.
- Workspace panels use 18px outer corners and a faint translucent inset edge.
  The composition shelf is `#171717` with a pure-white translucent image edge.
- Scene and layer rows are borderless. Space groups them; selected rows get a
  restrained fill and a thin blue leading edge.
- Controls, pills, transport buttons, and primary actions are fully rounded.
  The transport floats over the canvas rather than occupying a separate row.
- Timeline clips are neutral. A blue playhead and thin selected outline show
  editing state without competing with the video.
- The sound panel and inspector use spacing rather than nested card borders.

## Interaction

Hover changes color within 150ms. Pressed controls scale to 0.96. Keyboard
focus has a visible 2px blue ring. Reduced-motion users get the same content
without decorative transitions or pressed scaling. The preview's authored
motion is controlled by its own project timeline, separate from Studio chrome.

The shadcn preset `b51pyaag6` remains the component foundation. The Sunset
adaptation is isolated in `packages/studio/sunset-theme.css` so editor styling
can evolve without changing source components or authored videos.
