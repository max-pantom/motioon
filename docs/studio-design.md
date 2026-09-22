# design.md — Motion Studio, Sunset design system (light-mode, orange accent)

Visual and interaction source of truth for the Studio. Adapted from the Sunset
marketplace design system, **inverted to light mode** and re-accented with
**orange `#E8590C`** replacing Sunset's `#0071E3`. The Studio is the surface
where someone sits and manually scrubs/adjusts a render, so it keeps Sunset's
quiet, precise, software-native feel: the canvas is the artwork, and everything
around it stays compact and neutral.

## Product principles

- **The canvas is the focus.** Project artwork sits on a clean light shelf;
  chrome (header, sidebars, timeline chrome) is compact and neutral.
- **Space creates structure.** No decorative dividers or boxed rows when
  spacing already groups content. Grouping via 8–16px gaps, not hairlines.
- **Reuse one visual language.** Scenes, layers, assets, timeline blocks, and
  the inspector all share the same surface/control/inset tokens.
- **Motion explains interaction.** 150ms color transitions, pressed controls
  scale to 0.96, the export progress sweeps a ring arc. Never delay navigation
  or compete with the canvas artwork.
- **Selection uses weight and contrast.** Active states get surface fill,
  weight, and a thin semantic edge — never an animated underline.

## Color tokens (light-mode)

| Token         | Value                  | Use                                                            |
| ------------- | ---------------------- | -------------------------------------------------------------- |
| canvas        | `#F3F3F5`              | Page, sidebar, editor background                               |
| surface       | `#FFFFFF`              | Header, cards, selected rows                                   |
| surface-hover | `#F7F7F8`              | Card/surface hover feedback                                    |
| control       | `#EEEEEF`              | Inputs, segmented track, quiet controls                        |
| media         | `#ECECF0`              | Thumbnail fallback surface                                     |
| ink           | `#17171A`              | Primary text                                                   |
| ink-muted     | `rgb(23 23 26 / 0.68)` | Secondary navigation, metadata                                 |
| ink-soft      | `rgb(23 23 26 / 0.46)` | Captions, tertiary text                                        |
| action        | `#17171A`              | Dark accent surfaces (play, status)                            |
| action-ink    | `#FFFFFF`              | Text on dark accents                                           |
| focus         | `#E8590C`              | Orange accent: primary action, focus rings, playhead, progress |

Scene identity keeps a **semantic palette** (`--tint`/`--ink`) assigned once per
scene and reused everywhere that scene appears (scene number chip, timeline
block, track dot) — the same logic Health uses for ring segments.

## Typography

- Family: Inter via the system stack (`Inter`, `-apple-system`, …). No network
  font dependency — offline Studio must render identically.
- Page/section title: 20px / 24px, weight 500, tracking -0.02em.
- Project title: 16px / 20px, weight 500, ellipsis-truncated.
- Compact controls and labels: 12–13px, weight 500.
- Captions: 11–12px, weight 400–500.
- Timecodes, frame counts, durations, percentages: **tabular numerals**.
- Inputs stay 16px on small screens (prevents iOS zoom), 13px at desktop.

## Spacing

Base steps 4, 8, 10, 12, 16, 20, 24, 32, 40, 48. Headings sit 12–16px above
content, section gaps 24–32px, row rhythm ≥ 32px minimum height.

## Radius & depth

- Card outer radius **18px**; inner media radius stays concentric: **10px** at
  an 8px inset. Nested corners stay concentric (outer = inner + inset).
- Buttons, segmented tabs, pills, avatars, playhead cap: **fully circular**.
- Prefer translucent **inset outlines** over visible borders: cards
  `inset 0 0 0 1px rgb(23 23 26 / 0.05)`, controls `0.05`, media `0.08`.
- Elevation is soft and diffuse: `0 1px 3px rgb(0 0 0 / 0.04)` +
  `0 8px 24px rgb(0 0 0 / 0.06)`. Selection is a flat fill + edge, not a shadow.
- Directory rows receive **no** containers, borders, or background fills.

## Components (and how they map to Studio)

**Header** → 76px sticky surface bar. Logo aligns to the wide frame on the
left; the project title is centered to the viewport; undo/redo (circular),
"Edit source" (control pill), and "Export video" (orange pill) sit on the
right. Action height 34px.

**Browse index / segmented control** → Scenes/Assets switcher. Active tab uses
white surface fill + weight + inset; hover is color-only, never an underline.

**Project directory** → the scene list. Borderless backgroundless rows grouped
by spacing; hover strengthens the title color only; the active row becomes a
white surface pill with a thin **orange semantic edge** on its leading 3px.

**Screenshot/card treatment** → the canvas shell. The composition iframe is the
artwork: white surface, 10px radius, `media-edge` inset outline, soft wide
shadow so it reads as the hero object on the shelf.

**Floating action cluster** (Mail) → transport controls as a pill **floating
over the bottom of the canvas**, white surface, soft shadow, fully circular
buttons — never a docked toolbar in the layout flow.

**Color-coded timeline with a "now" line** (Calendar week) → the timeline:
scenes as `--tint` colored blocks on light lanes, orange playhead line with a
flat cap, block color = the scene's semantic color.

**Grouped list with chevrons** (Family) → the asset list: one rounded card
shell per asset, icon + title + metadata + media-edge on imagery.

**Ring / donut chart** (Health) → **export render progress**: a 172px ring
that sweeps its arc via the motion.dev `animate()` (spring/easeOut), bold
tabular percentage centered, `role="progressbar"` with live `aria-valuenow`.

**Inspector** → property controls as rounded `control`-fill fields with inset
outlines; sections grouped by spacing and small legends, no dividers.

## Motion

- Interaction color transitions: **150ms**.
- Transform/opacity changes use the motion.dev `motion` package (spring
  overshoot on the completion pop; easeOut on the progress arc).
- Animate only in response to interaction; never animate routine navigation or
  keyboard commands.
- Pressed controls scale to **0.96**.
- Honor `prefers-reduced-motion`: none of the above run, static content stays.

## Accessibility

- One visible main landmark (`main#preview`) and a skip link before repeated
  navigation.
- Native buttons perform actions; links navigate.
- Every icon-only control has an accessible name (undo/redo, prev/next, play).
- Focus uses a visible 2px orange ring and is never replaced by hover styling.
- Informative imagery gets alt text; decorative thumbnails and brand art use
  empty `alt`.
- Layout reflows at 320px and stays usable at 200% zoom.
- `color-scheme: light` is set at the document and CSS root.
