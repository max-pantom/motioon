# design.md — Motion Studio, Apple system inspiration

Reference doc distilled from Health, Mail (iPad), and Calendar/Family
screenshots. This is deliberately a **different register** than the dark
industrial / amber-monospace look used elsewhere (Comet, Turbine) — Studio
is the surface where someone sits and manually scrubs/adjusts a render, so
it leans toward the softer, consumer-grade polish Apple uses for anything
you're meant to spend calm, focused time in. Flag it if you'd rather unify
it with the darker system instead — easy to swap the tokens below.

## Philosophy

- **Content over chrome.** Backgrounds are near-white/light gray; color is
  spent on data and meaning, not decoration.
- **Color is semantic, not aesthetic.** Every hue maps to a category,
  person, or state (sleep=teal/coral/blue segments, calendar
  event-type colors, avatar-per-person color). Nothing is colored "because
  it looks nice."
- **Shape communicates hierarchy.** Big continuous corner radii (squircles)
  and pill shapes read as "soft, tappable, alive." Sharp corners are
  reserved for content (photos, flyers) that shouldn't feel UI-chrome-y.
  This directly opposes Comet's near-zero-radius brutalism — intentional,
  since Studio's job is manual fine-adjustment, not monitoring.
- **Depth is quiet.** Elevation comes from soft, diffuse shadows and subtle
  background-tint shifts, never hard drop shadows or heavy borders.

## Color

| Role                     | Value                                    |
|---------------------------|-------------------------------------------|
| Base background            | `#F2F2F5` (light gray, near-white)        |
| Elevated surface (card)    | `#FFFFFF` or a soft gradient wash (e.g. white → pale lavender `#EDEBFA`) |
| Primary text                | `#0A0A0A` – near-black, not pure black    |
| Secondary text              | `#6B6B70` – medium gray                   |
| Divider / hairline          | `#E5E5EA` at ~1px                          |
| Accent (selection/primary action) | `#0A84FF` (system blue)             |
| Semantic set (categories, people, data segments) | teal `#30D5A0`, coral `#FF7A59`, blue `#3A82F6`, pink `#FF5C8A`, purple `#8B5CF6`, green `#34C759`, amber `#FFB020` |

Semantic colors are assigned **once per entity** (a scene, an asset type,
a collaborator) and stay consistent everywhere that entity appears — the
same logic Health uses for ring segments and Calendar uses for event
categories.

## Typography

- Typeface: SN Pro Display (headlines) / SN Pro Text (body) — or the
  closest system equivalent (Inter is a reasonable substitute if SF Pro
  isn't licensable in-app).
- Headline: 32–40px, bold, tight line-height (~1.05), e.g. "A Good Night's
  Sleep."
- Body: 17–19px regular, relaxed line-height (~1.4), medium-gray.
- Numeric/data (ring center, scores): extra bold, tabular figures, sized to
  dominate its card (e.g. the "84").
- List row title: 15–17px semibold; subtitle 13–15px regular gray.
- No letterspacing tricks — Apple's system type doesn't need them at this
  weight.

## Shape & radius

| Element              | Radius        |
|-----------------------|----------------|
| Top-level card         | 24–28px (continuous/squircle) |
| Small stat pill (top row) | full pill (999px) |
| List row / grouped section | 14–16px, rows inside share one container |
| Avatar                  | full circle |
| Floating action button  | full circle |
| Buttons (inline)        | full pill |

## Elevation

- Cards: `box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)`
  — soft, wide, low-opacity. No hard edges.
- Floating buttons over content (Mail's trash/reply stack): same soft
  shadow, white fill, sit *on top of* content rather than being part of
  the layout flow.
- Selected list row: flat color fill (system blue), not a shadow — Apple
  uses fill-state, not elevation, to show selection.

## Core components (and how they map to Studio)

**Ring / donut score chart** (Health) → render progress, scene "confidence"
or duration-budget indicators. Multi-segment ring, bold number centered,
label above/beside it ("Sleep / High Score").

**Segmented pill tabs** (Mail's Primary/cart/chat/announcement row) →
Studio's view switcher (Timeline / Preview / Assets / Export), or a
scene-type filter.

**Grouped list with chevrons** (Family) → the scene list and asset list:
one rounded container, hairline dividers between rows, avatar/icon + title
+ metadata + chevron per row.

**Color-coded timeline blocks with a "now" line** (Calendar week view) →
this is almost exactly the Studio timeline: scenes as colored blocks along
a horizontal track, playhead as a red vertical line, block color = scene's
assigned semantic color, inline mini-content (like the "Water office
plants" checkbox inside a calendar block) for lightweight per-scene
actions (mute audio, toggle visibility).

**Floating circular action cluster** (Mail's trash/folder/reply/compose) →
Studio's transport controls (play/pause/scrub/export) as a floating column
or bar over the preview canvas rather than a docked toolbar.

**Split view, list + detail** (Mail on iPad) → Studio's overall layout:
scene list / asset panel on the left, live preview + inspector on the
right.

## Motion (implied, not directly visible in stills but standard Apple practice)

- Spring-based easing, not linear/ease-in-out — selections and sheet
  presentations settle with slight overshoot.
- Selection state changes are instant fills, not fades.
- Ring charts animate by sweeping the arc on load, not by fading in.

## Open question

This is a clean break from the dark-industrial/amber-monospace language
used on Comet and Turbine. Worth deciding explicitly: does Studio stay in
its own visual world (since it's a creative/manual tool, not a monitoring
dashboard), or should some shared DNA — accent color, type choice — bridge
it back to the rest of the suite?
