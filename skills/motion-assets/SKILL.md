---
name: motion-assets
description: Catalog and resolve Motion assets. Use when adding logos, UI captures, fonts, audio files, or when asset ids are missing. Triggers include assets, catalog, import, logo, screenshot, missing asset.
---

# Assets

For `openai-launch`, catalog the UI and sound assets before you board them.
Other Motioon projects may also declare project-local assets in frontmatter.
Every `asset:` id must resolve to a real local file.

## Ids

`logo` `ui.home` `ui.feature` `cursor.pointer` `tick.cut` …

Prefer `src: asset:ui.feature` for structured layers. Local relative paths are
also supported outside the catalog requirement of `openai-launch`.

## Capture

Use `motioon capture motion.md --url URL --flow flow.json --id ui.feature` to
film the real product. It records WebM and adds a catalog entry. Trim the
video layer to the useful interaction if the recording begins with loading.
Prefer an honest still to a generated fake interface.

## Describe

When the model is lost, list the catalog first. Then board. Then write scenes.
