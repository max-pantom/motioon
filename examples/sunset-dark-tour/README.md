# Sunset — Dark marketplace tour

A 12-second Motioon composition that follows two real links through the
locally running Sunset app: homepage → Nomo → Nomo's developer profile.

`capture.mjs` sets Sunset's actual dark-mode preference before navigation,
clicks both links in Chromium, captures the three pages, and stores visited
URLs and target bounds in `assets/capture.json`. The film uses those captures
without rebuilding their UI. Motioon adds an editable cursor, restrained
perspective entrances, and small camera pushes. There is no invented on-screen
copy or payment interaction.

```sh
node examples/sunset-dark-tour/capture.mjs
node bin/motion.mjs validate examples/sunset-dark-tour/motion.md
node bin/motion.mjs render examples/sunset-dark-tour/motion.md \
  -o examples/sunset-dark-tour/sunset-dark-tour-12s.mp4
```

Rendering writes an MP4 with the two click ticks and a sibling silent MP4.
