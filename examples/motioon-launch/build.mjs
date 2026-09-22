// Rebuilds ./motion.md for the Motioon launch film.
// Uses the @motioon/motion authoring package (packages/motion).
// Run:  node examples/motioon-launch/build.mjs
import { writeFileSync } from "node:fs";
import {
  film,
  scene,
  hero,
  sub,
  label,
  caption,
  text,
  shape,
  svgEl,
  tween,
  tracks,
  countUp,
  enter,
  ease,
} from "../../packages/motion/index.mjs";

const C = { accent: "#8B7CFF", text: "#FAFAFC", muted: "#9AA0AC" };

const f = film({
  title: "Motioon — One prompt. One film.",
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 12,
  background: "#05060a",
  theme: {
    accent: C.accent,
    text: C.text,
    muted: C.muted,
    font_display: "system-ui",
    font_body: "system-ui",
  },
  direction:
    "Dark cinematic typographic launch. One focal movement per scene, long holds, and a single spring accent on the stat card.\n",
});

const glow = svgEl(
  "glow",
  `<svg viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="g"><stop
    offset="0%" stop-color="#8B7CFF" stop-opacity="0.30"/>
    <stop offset="100%" stop-color="#8B7CFF" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="1200" fill="url(#g)"/>
</svg>`,
  {
    w: 1200,
    h: 1200,
    x: "50%",
    y: "50%",
    ...tracks(
      tween("opacity", 0, 1, { start: 0, duration: 1.6, easing: ease.expoOut }),
      tween("scale", 0.82, 1, { start: 0, duration: 2, easing: ease.expoOut }),
    ),
  },
);

f.scene("open", { duration: 2.4 }, [
  glow,
  label("word", "MOTIOON", {
    font_size: 34,
    font_weight: 700,
    letter_spacing: "0.5em",
    color: C.accent,
    x: "50%",
    y: "30%",
    split: "chars",
    stagger: 0.05,
    ...enter.slideLeft(0.55, 0.1),
  }),
]);

const rule = svgEl(
  "rule",
  `<svg viewBox="0 0 220 4" xmlns="http://www.w3.org/2000/svg"><line
    x1="0" y1="2" x2="220" y2="2" stroke="#8B7CFF" stroke-width="3"
    stroke-linecap="round"/></svg>`,
  { w: 220, h: 4, x: "50%", y: "58%", ...enter.draw(0.9, 1.5) },
);

f.scene(
  "statement",
  scene("statement", { duration: 3.8 }, [
    hero("headline", "Your launch video.", {
      w: 1600,
      font_size: 104,
      x: "50%",
      y: "40%",
      ...enter.type(1.7, 0.15),
    }),
    rule,
    caption("note", "Edited in markdown. Rendered in seconds.", {
      font_size: 26,
      color: C.muted,
      x: "50%",
      y: "66%",
      ...enter.fade(0.6, 2.2),
    }),
  ]),
);

f.scene("showcase", { duration: 3 }, [
  shape("cardBg", "rect", {
    fill: "#10131C",
    w: 960,
    h: 460,
    radius: 28,
    x: "50%",
    y: "50%",
    ...tracks(
      enter.slideLeft(0.65, 0.1),
      tween("scale", 0.94, 1, {
        start: 0.28,
        duration: 0.8,
        easing: ease.spring(3, 14),
      }),
    ),
  }),
  text("n300", "", {
    font_size: 64,
    font_weight: 800,
    color: C.accent,
    x: "34%",
    y: "39%",
    ...countUp(300, { start: 0.55, duration: 1.4 }),
  }),
  caption("c300", "frames rendered", {
    font_size: 26,
    color: C.muted,
    x: "53%",
    y: "39%",
    ...enter.fade(0.5, 0.75),
  }),
  text("n43", "", {
    font_size: 64,
    font_weight: 800,
    color: C.accent,
    x: "34%",
    y: "53%",
    ...countUp(43, { start: 0.8, duration: 1.2 }),
  }),
  caption("c43", "seconds of film", {
    font_size: 26,
    color: C.muted,
    x: "53%",
    y: "53%",
    ...enter.fade(0.5, 0.95),
  }),
  text("n1", "", {
    font_size: 64,
    font_weight: 800,
    color: C.accent,
    x: "34%",
    y: "67%",
    ...countUp(1, { start: 1.05, duration: 1 }),
  }),
  caption("c1", "one prompt", {
    font_size: 26,
    color: C.muted,
    x: "53%",
    y: "67%",
    ...enter.fade(0.5, 1.15),
  }),
]);

f.scene("end", { duration: 2.8 }, [
  hero("big", "One prompt. One film.", {
    w: 1700,
    font_size: 88,
    x: "50%",
    y: "40%",
    ...enter.fadeUp(0.7, 0.5),
  }),
  sub("tagline", "Motion — editable HTML video for agents", {
    font_size: 28,
    x: "50%",
    y: "56%",
    ...enter.fade(0.6, 1.3),
  }),
]);

writeFileSync(new URL("./motion.md", import.meta.url), f.md());
console.log("wrote examples/motioon-launch/motion.md");
