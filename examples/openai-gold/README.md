# OpenAI recipe gold clip

This project is the visual and audio acceptance fixture for the `openai` recipe.
It is a structured Motioon composition: four editable scenes, four audio cues,
and no embedded video.

```sh
node bin/motion.mjs validate examples/openai-gold/motion.md
node bin/motion.mjs render examples/openai-gold/motion.md -o test-results/openai-gold.mp4
```

The source recipe lives at `packages/core/recipes/openai.yml`. Audio is mixed by
the renderer from the cue sheet and normalized to the master target.
