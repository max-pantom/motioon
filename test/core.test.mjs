import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseMotionMarkdown, parseTime } from "../packages/core/parse.mjs";
import {
  validateComposition,
  assertValid,
} from "../packages/core/validate.mjs";
import { patchSource, revisionOf } from "../packages/core/patch.mjs";
import {
  compileToHtml,
  projectPath,
  loadComposition,
} from "../packages/core/index.mjs";
const sample = readFileSync(
  new URL("../examples/product-launch/motion.md", import.meta.url),
  "utf8",
);
const html = (extra = "", scenes = "## Scene: intro (0s-2s)\n<h1>Hello</h1>") =>
  `---\naspect_ratio: "640x360"\nduration: 2s\n${extra}\n---\n${scenes}`;
test("both original implementations parse into the same composition contract", () => {
  const first = parseMotionMarkdown(
    readFileSync(
      new URL("../motion/examples/product-launch/motion.md", import.meta.url),
      "utf8",
    ),
  );
  const second = parseMotionMarkdown(
    readFileSync(
      new URL("../motion-spec/test/fixtures/basic.motion.md", import.meta.url),
      "utf8",
    ),
  );
  assertValid(first);
  assertValid(second);
  assert.equal(first.scenes.length, 3);
  assert.equal(second.scenes.length, 2);
  assert.equal(second.width, 1080);
  assert.equal(second.assets.logo, "./assets/logo.png");
});
test("standard YAML preserves block HTML, quotes, comments and nested settings", () => {
  const c = parseMotionMarkdown(sample);
  assertValid(c);
  assert.match(c.scenes[0].elements[1].html, /<ellipse/);
  assert.equal(
    c.scenes[0].elements[4].text,
    "A little idea.\nA lot of motion.",
  );
  assert.equal(c.width, 1280);
});
test("invalid numeric inputs and malformed times never reach the renderer", () => {
  for (const bad of ["..s", "NaN", "Infinity", "1.2.3s", ""])
    assert.throws(() => parseTime(bad));
  assert.equal(parseTime("30f", 60), 0.5);
  assert.equal(parseTime("200ms"), 0.2);
  for (const extra of [
    "fps: 0",
    "width: -4\nheight: 360",
    "width: 0\nheight: 360",
    "fps: 3.5",
  ])
    assert.equal(
      validateComposition(parseMotionMarkdown(html(extra))).ok,
      false,
    );
  assert.throws(() =>
    parseMotionMarkdown(html("aspect: nope\naspect_ratio: nope")),
  );
});
test("duplicate assets and scenes, unknown references, out of bounds timing are rejected", () => {
  assert.throws(
    () =>
      parseMotionMarkdown(
        html("assets:\n - {id: logo, src: a.svg}\n - {id: logo, src: b.svg}"),
      ),
    /Duplicate asset/,
  );
  for (const body of [
    "## Scene: intro (0s-3s)\nHello",
    "## Scene: intro (0s-1s)\nHello\n## Scene: intro (1s-2s)\nWorld",
    '## Scene: intro (0s-2s)\n<img src="asset://missing">',
  ])
    assert.equal(
      validateComposition(parseMotionMarkdown(html("", body))).ok,
      false,
    );
});
test("gaps and layered overlap are warnings, coverage includes enclosing scenes", () => {
  const c = parseMotionMarkdown(
    html(
      "",
      "## Scene: back (0s-2s)\n<div>A</div>\n## Scene: over (0.2s-0.5s)\n<div>B</div>\n## Scene: label (1s-1.5s)\n<div>C</div>",
    ),
  );
  const d = validateComposition(c);
  assert.ok(d.ok);
  assert.ok(d.warnings.some((w) => w.includes("overlap")));
  assert.ok(!d.warnings.some((w) => w.includes("gap")));
});
test("studio patch changes source and preserves creative prose and other scene blocks", () => {
  const changed = patchSource(sample, {
    scene: "a-little-idea",
    element: "headline",
    set: { text: 'Hello "world"\nIt’s yours.', x: 300, font_size: 70 },
  });
  const c = parseMotionMarkdown(changed);
  assert.equal(c.scenes[0].elements[4].text, 'Hello "world"\nIt’s yours.');
  assert.equal(c.scenes[0].elements[4].x, 300);
  assert.ok(
    changed.includes(sample.slice(sample.indexOf("## scene: make-it-yours"))),
  );
  assert.ok(changed.includes("A calm, confident introduction"));
  assert.throws(
    () =>
      patchSource(sample, { scene: "a-little-idea", set: { duration: 20 } }),
    /ends after/,
  );
  assert.throws(
    () => patchSource(sample, { set: { title: "Oops" }, revision: "stale" }),
    /source changed/i,
  );
  assert.notEqual(revisionOf(changed), revisionOf(sample));
});
test("HTML serialization escapes payload termination and single-quoted metadata", () => {
  const c = parseMotionMarkdown(sample);
  c.title = "</script><script>bad()</script>";
  c.scenes[0].elements[4].text = "it's </script>";
  const output = compileToHtml(c);
  assert.ok(output.includes("\\u003c/script>"));
  assert.ok(output.includes("&#39;"));
  assert.ok(!output.includes("<script>bad()"));
});
test("project files cannot escape through traversal or symlinks", () => {
  const root = mkdtempSync(join(tmpdir(), "motioon-path-"));
  const outside = mkdtempSync(join(tmpdir(), "motioon-out-"));
  try {
    writeFileSync(join(outside, "secret"), "secret");
    symlinkSync(join(outside, "secret"), join(root, "link"));
    assert.throws(() => projectPath(root, "../secret"));
    assert.throws(() => projectPath(root, "link"));
    assert.throws(() => projectPath(root, "https://example.com/a.png"));
  } finally {
    rmSync(root, { recursive: true });
    rmSync(outside, { recursive: true });
  }
});
test("kinetic text compiles token spans and accepts advanced transitions", () => {
  const source = readFileSync(
    new URL("../examples/kinetic-showcase/motion.md", import.meta.url),
    "utf8",
  );
  const comp = parseMotionMarkdown(source);
  assertValid(comp);
  const output = compileToHtml(comp);
  assert.match(output, /class="motion-token"/);
  assert.equal(comp.scenes[0].transition.type, "zoom");
  assert.equal(comp.scenes[0].elements[1].split, "words");
});

test("openai recipe applies defaults and expands audio cue-sheet oneshots", () => {
  const comp = parseMotionMarkdown(`---
title: Recipe fixture
recipe: openai
width: 640
height: 360
fps: 30
duration: 2
audio:
  master: {lufs: -16, peak: -1.5, sample_rate: 48000}
  tracks:
    - id: tick
      kind: sting
      src: ./tick.wav
      at: [0, 1.2]
      gain_db: -16
---
## scene: intro
\`\`\`motion
duration: 2
elements:
  - id: title
    type: text
    text: Hello
    enter: {preset: rise, duration: 0.32, easing: "cubic-bezier(0.16, 1, 0.3, 1)"}
\`\`\`
`);
  assert.equal(comp.background, "#FFFFFF");
  assert.equal(comp.audio.length, 2);
  assert.deepEqual(
    comp.audio.map((a) => a.at),
    [0, 1.2],
  );
  assert.equal(comp.audioMaster.sample_rate, 48000);
  assert.equal(validateComposition(comp).ok, true);
  assert.match(compileToHtml(comp), /name === "rise"/);
});

test("openai recipe lints forbidden motion and sound", () => {
  const comp = parseMotionMarkdown(`---
title: Bad recipe fixture
recipe: openai
duration: 1
audio:
  tracks:
    - {id: sweep, kind: whoosh, src: ./sweep.wav, at: 0}
---
## scene: intro
\`\`\`motion
duration: 1
elements:
  - {id: title, type: text, text: Hello, enter: fade-up 0.3}
\`\`\`
`);
  const result = validateComposition(comp);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("whoosh")));
  assert.ok(result.errors.some((e) => e.includes("fade-up")));
});

test("events synchronize cursor, behaviors and audio without raw keyframes", () => {
  const comp = parseMotionMarkdown(`---
title: Behaviors
width: 640
height: 360
duration: 2
events: {open: 0.4}
paths:
  arc: {type: bezier, points: [[0, 0], [100, 0], [100, 100], [200, 100]]}
audio:
  tracks:
    - {id: click, kind: sting, src: ./click.wav, at: "event:open"}
---
## scene: demo
\`\`\`motion
duration: 2
camera: {type: push, from: 1, to: 1.04, follow: cursor, strength: 0.06}
cursor:
  x: 90%
  y: 80%
  actions:
    - {type: move, at: 0, to: [50%, 50%], duration: 0.3}
    - {type: click, at: 0.4, event: open}
elements:
  - id: title
    type: text
    text: Hello
    behaviors:
      - {type: mask, shape: circle, origin: cursor, on: open}
      - {type: blur-in, from: 18, to: 0, on: open}
      - {type: path-follow, path: arc, duration: 1}
\`\`\`
`);
  assertValid(comp);
  assert.equal(comp.events.open, 0.4);
  assert.equal(comp.audio[0].at, 0.4);
  assert.deepEqual(
    comp.scenes[0].elements[0].behaviors.map((b) => b.type),
    ["mask", "blur", "path"],
  );
  assert.match(compileToHtml(comp), /motion-cursor/);
});

test("banger example normalizes timed paths, typewriter, tilt and camera anchor", () => {
  const comp = loadComposition(
    new URL("../examples/banger-8s/motion.md", import.meta.url).pathname,
  );
  assertValid(comp);
  assert.equal(comp.scenes[0].elements[1].path.length, 2);
  assert.equal(comp.scenes[1].cursor.path[1].click, true);
  assert.equal(comp.scenes[1].camera.anchor[0], "52%");
  const group = comp.scenes[1].elements[0];
  assert.equal(group.enter.preset, "tilt-in");
  assert.equal(group.keyframes.rotateY[0].v, -16);
  assert.equal(
    group.children.find((el) => el.id === "typed").typewriter.cps,
    10,
  );
  assert.equal(comp.audio.find((track) => track.id === "click").at, 2.2);
});

test("Sunset film uses captured site pages, timed clicks and source lockup proportions", () => {
  const comp = loadComposition(
    new URL("../examples/sunset-idea-8s/motion.md", import.meta.url).pathname,
  );
  assertValid(comp);
  assert.equal(comp.duration, 14);
  assert.equal(comp.brand.accent, "#0071E3");
  assert.equal(comp.brand.logoLockup.gap, 8);
  assert.ok(
    Math.abs(comp.audio.find((track) => track.id === "list-click").at - 3.15) <
      1e-9,
  );
  assert.equal(comp.audio.find((track) => track.id === "project-click").at, 8);
  assert.equal(comp.scenes[2].elements[0].children.length, 3);
  assert.equal(comp.scenes[2].elements[0].children[1].src, "asset:homepage");
  assert.equal(comp.scenes[3].elements[1].src, "asset:nomo-page");
  assert.equal(comp.scenes[0].elements[0].text, "Buy and sell software.");
  assert.equal(comp.scenes[0].elements[0].typewriter.cps, 13);
  assert.equal(comp.scenes[0].elements[0].enter.preset, "fade");
  assert.equal(comp.scenes[4].elements[1].text, "Software changes hands.");
  assert.equal(
    comp.scenes.some((scene) => scene.elements.some((el) => el.count)),
    false,
  );
  const page = compileToHtml(comp);
  assert.match(page, /brand-lockup-inner/);
  assert.match(page, /gap:38\.666/);
  assert.match(page, /width:135\.333/);
});

test("Sunset dark tour follows captured pages with two clicks and 3D entrances", () => {
  const comp = loadComposition(
    new URL("../examples/sunset-dark-tour/motion.md", import.meta.url).pathname,
  );
  assertValid(comp);
  assert.equal(comp.duration, 12);
  assert.deepEqual(
    comp.scenes.map((scene) => scene.id),
    ["home", "nomo", "developer"],
  );
  assert.equal(comp.audio.find((track) => track.id === "home-click").at, 3.45);
  assert.equal(
    comp.audio.find((track) => track.id === "profile-click").at,
    7.5,
  );
  assert.deepEqual(
    comp.scenes.map((scene) => scene.elements[0].children[1].src),
    ["asset:home", "asset:project", "asset:developer"],
  );
  for (const scene of comp.scenes) {
    assert.equal(scene.elements[0].enter.preset, "tilt-in");
    assert.equal(scene.elements[0].keyframes.rotateY.at(-1).v, 0);
  }
});
