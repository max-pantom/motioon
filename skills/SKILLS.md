# Motion skills

Bundled with Motioon. An agent can inspect the installed paths using
`motioon skills` or `motioon agent`. Start with the router, then load only the
skills relevant to the current edit. `SPEC.md` defines supported syntax.

| skill | load when |
|---|---|
| `motion` | any video job (loop, lint, editor ops) |
| `motion-story` | premise, audience, promise, one-sentence spine |
| `motion-storyboard` | shot list before `motion.md` |
| `motion-setup` | aspect, duration, catalog, capture, recipe |
| `motion-staging` | where things sit, overlap, letterbox |
| `motion-scenes` | scene math, holds, cuts |
| `motion-text` | type, line breaks, roles |
| `motion-camera` | zoom tiers, push, framing |
| `motion-presets` | enter/exit, springs, easings |
| `motion-beats` | overlapping beats, stagger |
| `motion-cursor` | pointer, click, type-in demos |
| `motion-taste` | openai-launch recipe and composition taste |
| `motion-sound` | ticks, plan, mix |
| `motion-assets` | catalog, capture, `asset:` ids |

Agent order for a new piece:

1. `motion-setup`
2. `motion-story` + `motion-storyboard`
3. `motion-taste` (pick a recipe)
4. write `motion.md` using staging / scenes / text / camera / presets / beats
5. add cursor only if there is a UI tape
6. `motion-sound` then render
