# Bart launch

This is a 12-second square launch film authored entirely as structured Motioon
scenes. Studio exposes four scenes and their individual layers for editing.

The cobalt lamp, coral chair, and pleated textile are original bitmap assets
created with the built-in GPT Image tool for this project. The quiet audio bed
was generated locally from synthesized tones. No video footage from the Cosmos
reference is embedded or used.

```sh
node bin/motion.mjs validate examples/bart-launch/motion.md
node bin/motion.mjs studio examples/bart-launch/motion.md --port 4402
node bin/motion.mjs render examples/bart-launch/motion.md -o test-results/bart-launch.mp4 --workers 4
```
