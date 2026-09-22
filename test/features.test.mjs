import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseMotionMarkdown } from "../packages/core/parse.mjs";
import {
  validateComposition,
  assertValid,
} from "../packages/core/validate.mjs";
import { compileToHtml } from "../packages/core/compile.mjs";
import { insertSource } from "../packages/core/patch.mjs";

const compact = (body, extra = "") =>
  `---\nversion: 1\ntitle: t\nduration: 3\n${extra}---\n## scene: s\n\`\`\`motion\nduration: 3\nelements:\n${body}\`\`\`\n`;

test("sunset-launch renders parse, validate and compile", () => {
  const source = readFileSync(
    new URL("../examples/sunset-launch/motion.md", import.meta.url),
    "utf8",
  );
  const comp = parseMotionMarkdown(source);
  assertValid(comp);
  assert.equal(comp.width, 1080);
  assert.equal(comp.height, 1350);
  assert.equal(comp.fps, 60);
  assert.equal(comp.duration, 8);
  assert.deepEqual(
    comp.scenes.map((s) => s.duration),
    [1.5, 3.7, 2.8],
  );
  const endcard = comp.scenes[2].elements[0];
  assert.equal(endcard.type, "group");
  assert.equal(endcard.children.length, 3);
  const html = compileToHtml(comp);
  assert.match(html, /class="el el-group/);
  assert.match(html, /class="el el-svg/);
});

test("animate tracks normalize from/to with per-property and defaults easing", () => {
  const comp = parseMotionMarkdown(
    compact(`  - id: a
    type: text
    text: hi
    animate:
      opacity: { from: 0, to: 1, start: 0.2, duration: 0.5, easing: expo.out }
      y: [24, 0]
      scale: { from: 0.9, to: 1 }`),
  );
  assertValid(comp);
  const tracks = comp.scenes[0].elements[0].animate;
  assert.equal(tracks.length, 3);
  assert.deepEqual(tracks[0], {
    prop: "opacity",
    from: 0,
    to: 1,
    start: 0.2,
    duration: 0.5,
    easing: "expo.out",
  });
  assert.deepEqual(tracks[1], {
    prop: "y",
    from: 24,
    to: 0,
    start: 0,
    duration: 0.6,
    easing: "ease-out",
  });
  assert.equal(tracks[2].from, 0.9);
});

test("count and replace normalize", () => {
  const comp = parseMotionMarkdown(
    compact(`  - id: n
    type: text
    count: { to: 2400, prefix: "$", duration: 1.2 }
  - id: r
    type: caption
    text: a
    replace:
      - { at: 1, text: b }
      - { at: 0.5, text: c }`),
  );
  assertValid(comp);
  const [n, r] = comp.scenes[0].elements;
  assert.deepEqual(n.count, {
    from: 0,
    to: 2400,
    start: 0,
    duration: 1.2,
    easing: "ease-out",
    prefix: "$",
    suffix: "",
    decimals: 0,
    thousands: true,
  });
  assert.deepEqual(r.replace, [
    { at: 0.5, text: "c" },
    { at: 1, text: "b" },
  ]);
});

test("spring easing and new presets validate", () => {
  const comp = parseMotionMarkdown(
    compact(`  - id: x
    type: text
    enter: pop 0.6 0 spring(3, 8)
  - id: y
    type: svg
    w: 100
    h: 100
    svg: |
      <svg viewBox="0 0 50 50"><line x1="5" y1="25" x2="45" y2="25"/></svg>
    enter: draw 1
  - id: z
    type: text
    split: chars
    enter: type 0.5`),
  );
  const d = validateComposition(comp);
  assert.equal(d.ok, true, d.errors.join("; "));
});

test("invalid tracks, easings, counts and nested ids are rejected", () => {
  const parseThrows = [
    "bad prop",
    compact(`  - id: a
    type: text
    text: x
    animate: { width: { from: 0, to: 1 } }`),
    "count not object",
    compact(`  - id: a
    type: text
    count: 5`),
    "group without children",
    compact(`  - id: g
    type: group`),
  ];
  for (let i = 0; i < parseThrows.length; i += 2)
    assert.throws(
      () => parseMotionMarkdown(parseThrows[i + 1]),
      undefined,
      `expected "${parseThrows[i]}" to fail parsing`,
    );
  const validateFails = [
    "bad easing",
    compact(`  - id: a
    type: text
    text: x
    animate: { opacity: { from: 0, to: 1, easing: expo-out } }`),
    "replace out of range",
    compact(`  - id: a
    type: text
    replace: [{ at: 9, text: nope }]`),
    "duplicate id across nests",
    compact(`  - id: g
    type: group
    children:
      - id: dup
        type: text
  - id: dup
    type: text`),
  ];
  for (let i = 0; i < validateFails.length; i += 2)
    assert.equal(
      validateComposition(parseMotionMarkdown(validateFails[i + 1])).ok,
      false,
      `expected "${validateFails[i]}" to fail validation`,
    );
});

test("svg and nested group compile into the DOM", () => {
  const comp = parseMotionMarkdown(
    compact(`  - id: g
    type: group
    at: 0
    children:
      - id: inner
        type: svg
        w: 80
        h: 80
        svg: |
          <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>
        enter: draw 0.8
      - id: label
        type: text
        text: hi
        blur: 4`),
  );
  assertValid(comp);
  const html = compileToHtml(comp);
  assert.match(html, /data-id="g".*data-id="inner"[^]*data-spec=/);
  assert.ok(html.includes("<circle"));
  assert.ok(html.includes("el-group"));
  assert.ok(html.includes("el-svg"));
  const circleIndex = html.indexOf('<svg viewBox="0 0 10 10"');
  assert.ok(circleIndex > -1, "svg content should be injected raw");
});

test("insertSource appends scenes, elements, animations and assets", () => {
  const base = `---\nversion: 1\ntitle: t\nduration: 2\n---\n## scene: s\n\`\`\`motion\nduration: 2\nelements:\n  - id: a\n    type: text\n    text: A\n\`\`\`\n`;
  let source = insertSource(base, {
    element: { id: "b", type: "caption", text: "B" },
    scene: "s",
  });
  source = insertSource(source, {
    animation: { opacity: { from: 0, to: 1, start: 0.2 } },
    scene: "s",
    element: "a",
  });
  source = insertSource(source, { scene: { id: "next", duration: 1.5 } });
  source = insertSource(source, {
    element: { id: "seed", type: "caption", text: "Seed" },
    scene: "next",
  });
  source = insertSource(source, { asset: { id: "logo", src: "./l.svg" } });
  const comp = parseMotionMarkdown(source);
  assertValid(comp);
  assert.equal(comp.scenes.length, 2);
  assert.equal(comp.duration, 3.5);
  assert.equal(comp.scenes[0].elements[1].id, "b");
  assert.equal(comp.scenes[0].elements[0].animate[0].to, 1);
  assert.equal(comp.scenes[1].elements[0].id, "seed");
  assert.equal(comp.assets.logo, "./l.svg");
  assert.throws(
    () => insertSource(base, { element: { id: "x" }, scene: "missing" }),
    /not found/,
  );
});
