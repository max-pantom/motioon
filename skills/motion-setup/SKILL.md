---
name: motion-setup
description: Start a Motion project the right way. Use before writing scenes when aspect, duration, catalog, capture, recipe, or project setup is missing. Triggers include setup, new project, aspect ratio, catalog, capture the app, make a video for this repo.
---

# Setup

A project is not a blank `motion.md`. It is tape settings plus things you can point at.

## Checklist

1. Aspect — `16:9` launch / desk. `9:16` phone / short. Do not invent `1080x1920` and then board a desktop UI full-bleed.
2. Duration — punch 8s, launch 12s, explain ≤ 25s. Say the number.
3. Recipe — use the implemented `openai-launch` recipe when the brief calls
   for it. `poster`, `object`, and `board` are craft directions, not registered
   recipe IDs in the current CLI.
4. Catalog — list `assets/catalog.json`. If empty, capture or import before story.
5. Audio kit — `tick.cut` `tick.point` `tick.arrive` exist or will be synth’d.

## Catalog ids

For cataloged assets, layers use `asset:id`. A missing id is a validation error.

Typical ids for a feature launch:

- `logo`
- `ui.home` `ui.feature` (webm or png)
- `tick.cut` `tick.point` `tick.arrive`

## Capture

If the user said “make a video for this project” and there is a running app:

```text
motioon capture path/to/motion.md --url URL --flow flow.json --out assets/ui/feature.webm --id ui.feature
```

Still-frame the key state too. Prefer one honest still over a fake mockup.

## Frontmatter skeleton

```yaml
version: 1
title: Feature live
aspect: 16:9
fps: 24
duration: 8
background: "#FFFFFF"
recipe: openai-launch
catalog: ./assets/catalog.json
theme:
  text: "#111111"
  muted: "#8E8EA0"
  accent: "#111111"
audio:
  master: { lufs: -16, peak: -1.5 }
  tracks:
    - {id: cuts, kind: sting, src: "asset:tick.cut", at: cuts, gain_db: -18, oneshot: true}
```

Then `motion-story`. Not scenes first.
