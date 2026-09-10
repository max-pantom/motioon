# Cosmos reference reconstruction

Reference: user-supplied `/Users/macbook/Downloads/83-0.mp4`.

The project uses a 1080 × 1080 canvas, 25 fps, 501 frames (20.04 seconds),
and the supplied AAC soundtrack. Its text, contextual pills, scene selection,
photo-card movement, phone transforms and continuous image-grid scrolling are
authored in `motion.md`. Motion tracks use positions measured from the reference.

The photos and interface crops were extracted from the supplied video using
FFmpeg. They are source assets, not GPT Image generations. Clean photo-card
assets combine unoccluded regions from different reference frames; the labels
are separate HTML. The phone detail view is a static interface crop. The search
view combines a header/footer with 13 separate photo tiles in two scrolling
columns. The exact closing wordmark is a reference crop, split into animated
letter regions. Inter is bundled under its accompanying OFL license.

This remains a reconstruction rather than a pixel-identical restoration. Font
rasterization, some entrance easing, the room-to-phone handoff and the click
feedback still differ. The original application source was not supplied.

Frame measurements and before/after image comparisons are in `test-results/`.
Their error metric is a diagnostic, not proof of a 1:1 match.

Preview:

```sh
node bin/motion.mjs studio examples/cosmos-reference/motion.md --port 4401
```

Render:

```sh
node bin/motion.mjs render examples/cosmos-reference/motion.md -o test-results/cosmos-recreated.mp4 --workers 4
```
