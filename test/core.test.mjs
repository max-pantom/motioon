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
import { compileToHtml, projectPath } from "../packages/core/index.mjs";
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
