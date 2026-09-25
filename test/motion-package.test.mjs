import test from "node:test";
import assert from "node:assert/strict";
import {
  film,
  scene,
  toMarkdown,
  hero,
  text,
  label,
  sub,
  caption,
  shape,
  svgEl,
  group,
  cursor,
  component,
  number,
  mask,
  tween,
  tracks,
  countUp,
  swap,
  enter,
  ease,
} from "../packages/motion/index.mjs";
import { parseMotionMarkdown } from "../packages/core/parse.mjs";
import { assertValid } from "../packages/core/validate.mjs";

test("motion package helpers build the expected specs", () => {
  assert.deepEqual(enter.fadeUp(0.7, 0.1), {
    enter: { preset: "fade-up", duration: 0.7, delay: 0.1, easing: "expo.out" },
  });
  assert.deepEqual(ease.spring(3, 12), "spring(3, 12)");
  assert.deepEqual(tween("y", 24, 0, { start: 0.2 }), {
    animate: {
      y: { from: 24, to: 0, start: 0.2, duration: 0.6, easing: "expo.out" },
    },
  });
  assert.deepEqual(countUp(12483, { start: 1.1 }), {
    count: {
      to: 12483,
      from: 0,
      start: 1.1,
      duration: 1.2,
      easing: "expo.out",
      prefix: "",
      suffix: "",
      decimals: 0,
      thousands: true,
    },
  });
  assert.deepEqual(swap([{ at: 1, text: "One." }]), {
    replace: [{ at: 1, text: "One." }],
  });
  assert.deepEqual(
    tracks(enter.fadeUp(), countUp(5), tween("scale", 0.92, 1)),
    {
      enter: { preset: "fade-up", duration: 0.7, delay: 0, easing: "expo.out" },
      count: {
        to: 5,
        from: 0,
        start: 0,
        duration: 1.2,
        easing: "expo.out",
        prefix: "",
        suffix: "",
        decimals: 0,
        thousands: true,
      },
      animate: {
        scale: {
          from: 0.92,
          to: 1,
          start: 0,
          duration: 0.6,
          easing: "expo.out",
        },
      },
    },
  );
});

test("motion package emits motion.md that parses and validates", () => {
  const f = film({
    title: "Package test",
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 8,
    background: "#05060a",
    theme: { accent: "#8B7CFF", text: "#FAFAFC", muted: "#9AA0AC" },
    direction: "One confident statement. Give it room.\n",
  });
  f.scene(
    "statement",
    scene("statement", { duration: 3.6 }, [
      hero("headline", "Your film.", {
        w: 1500,
        font_size: 104,
        x: "50%",
        y: "40%",
        ...enter.type(1.5, 0.2),
      }),
      caption("note", "reads clearly", {
        font_size: 24,
        x: "50%",
        y: "58%",
        ...enter.fade(0.5, 1.6),
      }),
    ]),
  );
  f.scene("end", { duration: 2.8 }, [
    label("mark", "MOTIOON", {
      font_size: 30,
      letter_spacing: "0.5em",
      x: "50%",
      y: "30%",
      split: "chars",
      stagger: 0.05,
      ...enter.slideLeft(0.5, 0.4),
    }),
    svgEl(
      "accents",
      '<svg viewBox="0 0 60 10" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="60" y2="5" stroke="#8B7CFF" stroke-width="3"/></svg>',
      {
        w: 300,
        h: 10,
        x: "50%",
        y: "42%",
        ...enter.draw(0.9, 1),
      },
    ),
  ]);
  const md = f.md();
  const comp = parseMotionMarkdown(md);
  assertValid(comp);
  assert.equal(comp.width, 1920);
  assert.equal(comp.duration, 8);
  assert.equal(comp.scenes.length, 2);
  const head = comp.scenes[0].elements[0];
  assert.equal(head.id, "headline");
  assert.equal(head.enter.preset, "type");
  assert.equal(comp.scenes[1].elements[1].enter.preset, "draw");
  assert.match(md, /^## scene: statement/m);
});

test("toMarkdown rejects duplicate or missing scene ids", () => {
  assert.throws(
    () =>
      toMarkdown({
        title: "x",
        width: 100,
        height: 100,
        fps: 30,
        duration: 2,
        background: "#000",
        scenes: [
          scene("a", { duration: 1, elements: [] }),
          scene("a", { duration: 1, elements: [] }),
        ],
      }),
    /duplicate scene id/,
  );
  assert.throws(
    () =>
      toMarkdown({
        title: "x",
        width: 100,
        height: 100,
        fps: 30,
        duration: 2,
        background: "#000",
        scenes: [scene("", { duration: 1, elements: [] })],
      }),
    /needs an id/,
  );
});

test("group helper nests children; element builders set defaults", () => {
  const g = group("card", [shape("bg", "rect", { fill: "#101020" })], {
    ...enter.slideLeft(),
  });
  assert.equal(g.type, "group");
  assert.equal(g.children[0].type, "shape");
  assert.equal(g.children[0].shape, "rect");
  assert.equal(hero("h", "Hola").role, "hero");
  assert.equal(label("l", "L").role, "label");
  assert.equal(sub("s", "S").role, "sub");
  assert.equal(caption("c", "C").type, "caption");
  assert.equal(svgEl("v", "<svg/>").type, "svg");
});

test("brand and interaction builders survive motion.md serialization", () => {
  const f = film({
    title: "Interaction",
    duration: 2,
    brand: {
      accent: "#0071E3",
      typeScale: { title: 48 },
      spacing: [8, 16],
      radius: 20,
    },
  });
  f.scene("action", {
    duration: 2,
    cursor: {
      x: "90%",
      y: "80%",
      actions: [
        cursor.moveTo(["50%", "50%"], { duration: 0.5 }),
        cursor.click({ at: 0.8, event: "select" }),
      ],
    },
    elements: [
      component.decompose("card", [
        shape("surface", "rect", {
          w: 400,
          h: 200,
          fill: "#EEEEEE",
          ...mask.reveal({ on: "select", duration: 0.3 }),
        }),
      ]),
      text("typed", "Software", {
        ...text.type({ cps: 9, caret_color: "#0071E3" }),
      }),
    ],
  });
  const comp = parseMotionMarkdown(f.md());
  assertValid(comp);
  assert.equal(comp.brand.accent, "#0071E3");
  assert.equal(comp.events.select, 0.8);
  assert.equal(
    comp.scenes[0].elements[0].children[0].behaviors[0].type,
    "mask",
  );
  assert.equal(comp.scenes[0].elements[1].typewriter.caret_color, "#0071E3");
  assert.deepEqual(number.count(10), countUp(10));
  assert.equal(component.enter("fade").enter.preset, "fade");
  assert.equal(component.transitionTo({ scale: [0.9, 1] }).animate.scale.to, 1);
  assert.deepEqual(
    text.replace([{ at: 1, text: "Done" }]),
    swap([{ at: 1, text: "Done" }]),
  );
});
