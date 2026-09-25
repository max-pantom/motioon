---
name: motion-router
description: Route a Motion video job to the right craft skill. Use at the start of any Motion request when you are unsure which skill to load. Triggers include motion video, launch film, which skill, start a clip.
---

# Router

Load `motion` plus the smallest extra set from the adjacent project skills.
Run `motioon skills` if the installed skill paths are unclear. Treat this
router as guidance for choosing a skill; the active `motion.md` and current
`SPEC.md` remain the source of truth for supported syntax.

| user says | load |
|---|---|
| make a video for this app / repo | setup, assets, story, storyboard, taste |
| story / why / message | story |
| board / shots | storyboard |
| looks centered / messy | staging, text |
| pacing / too even | scenes, beats |
| zoom / punch / camera | camera |
| bouncy / generic fades | presets, taste |
| cursor / click demo | cursor, camera |
| sound / mix / ticks | sound |
| openai / launch film | taste, scenes, text, camera, sound |

For a new piece, prefer setup → story → board → spec → sound → render. For a
focused edit, load only the matching craft skill and keep the existing source.

Do not load every skill at once.
