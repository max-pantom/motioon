# Sunset — The secondary market for software

An editable 14-second Motioon film based on the supplied storyboard and revision.
It types `Buy and sell software.` with a fade, clicks `List a project`, enters a capture of the actual
Sunset homepage, hovers and opens a visible Nomo listing, then ends with
`Software changes hands.` and the Sunset lockup.

The editable typeface is the local Geist variable font (with its bundled
license in `assets/GEIST-LICENSE.txt`). The mark is copied from the six SVG paths in
`/Users/macbook/Desktop/code/sunset/components/sunset-logo.tsx`; its 28×26
mark, 8px gap, 24px wordmark, medium weight, and `-0.035em` tracking are stored
as `brand.logoLockup` and scale together. `assets/site/homepage.png` and
`assets/site/project.png` were captured from the running Sunset app at a fixed
1600 × 900 viewport. `assets/site/project-card-hover.png` captures the DOM card
in its real hover state; `capture.json` records the source, visible listings,
and measured card bounds. The live homepage showed Nomo at $500, so the film
follows Nomo rather than inventing a Mori card on the homepage. The cursor and
card hover remain separate editable layers. The supplied ZaroAI video informed
pacing and visual language but no footage or audio was copied.

```sh
node examples/sunset-idea-8s/build-sound.mjs
node examples/sunset-idea-8s/capture-site.mjs # refresh from running Sunset at localhost:3000
node bin/motion.mjs validate examples/sunset-idea-8s/motion.md
node bin/motion.mjs render examples/sunset-idea-8s/motion.md \
  -o examples/sunset-idea-8s/sunset-secondary-market-14s.mp4
```

The render creates an audio version and a sibling `.silent.mp4`. Open the source
in Motioon Studio to adjust text, timing, assets, and scene layers.
