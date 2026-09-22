import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  openSession,
  sessionFor,
  runCommand,
  describe,
  opSchema,
} from "../packages/editor/editor.mjs";
import { revisionOf } from "../packages/core/patch.mjs";
import { loadComposition } from "../packages/core/index.mjs";

const fixture = `---
title: Editor test
width: 1280
height: 720
fps: 30
duration: 5
background: "#000"
---
# Direction
Preserve this brief text exactly.
## scene: intro
\`\`\`motion
duration: 3
elements:
  - id: title
    type: text
    role: hero
    text: Hello
    x: 640
    y: 320
    opacity: 0.7
  - id: badge
    type: text
    text: LIVE
    at: 1
    duration: 1.5
    opacity: 0
\`\`\`
## scene: outro
\`\`\`motion
duration: 2
elements:
  - id: end
    type: text
    text: Bye
\`\`\`
`;
let dirs = [];
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "motioon-editor-"));
  const file = join(dir, "motion.md");
  writeFileSync(file, fixture);
  dirs.push(dir);
  return file;
}
test.after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

test("describe returns the brief tape shape (absolute scenes and layers)", () => {
  const file = setup();
  const d = describe(sessionFor(file));
  assert.equal(d.file, file);
  assert.equal(d.fps, 30);
  assert.equal(d.duration, 5);
  assert.deepEqual(d.scenes[0], {
    id: "intro",
    start: 0,
    duration: 3,
    transition: "cut",
    elementCount: 2,
  });
  assert.equal(d.scenes[1].start, 3);
  const title = d.layers.find((l) => l.id === "title");
  assert.equal(title.scene, "intro");
  assert.equal(title.role, "hero");
  assert.equal(title.start, 0);
  assert.equal(title.opacity, 0.7);
  assert.equal(title.locked, false);
  const badge = d.layers.find((l) => l.id === "badge");
  assert.equal(badge.start, 1);
  assert.equal(badge.duration, 1.5);
  assert.equal(badge.enabled, true);
});

test("set moves text, position, opacity and role; persists and preserves prose", () => {
  const file = setup();
  const s = openSession(file);
  runCommand(s, { op: "set", layer: "title", prop: "text", value: "Edited" });
  runCommand(s, { op: "set", layer: "title", prop: "x", value: 200 });
  runCommand(s, { op: "set", layer: "badge", prop: "opacity", value: 1 });
  runCommand(s, { op: "set", layer: "badge", prop: "role", value: "label" });
  const comp = loadComposition(file);
  const [title, badge] = comp.scenes[0].elements;
  assert.equal(title.text, "Edited");
  assert.equal(title.x, 200);
  assert.equal(badge.opacity, 1);
  assert.equal(badge.role, "label");
  assert.match(
    readFileSync(file, "utf8"),
    /Preserve this brief text exactly\./,
  );
});

test("set respects timeline: move + trim clamp layers to their scene", () => {
  const file = setup();
  const s = openSession(file);
  runCommand(s, { op: "move", layer: "badge", start: 2.5 });
  let comp = loadComposition(file);
  assert.equal(comp.scenes[0].elements[1].at, 2.5);
  runCommand(s, { op: "trim", layer: "badge", duration: 9 });
  comp = loadComposition(file);
  assert.equal(comp.scenes[0].elements[1].duration, 0.5);
  assert.equal(
    comp.scenes[0].elements[1].at + comp.scenes[0].elements[1].duration,
    3,
  );
});

test("enabled persists as hidden; locked is session state", () => {
  const file = setup();
  const s = openSession(file);
  runCommand(s, { op: "set", layer: "end", prop: "enabled", value: false });
  runCommand(s, { op: "lock", layer: "end" });
  assert.equal(loadComposition(file).scenes[1].elements[0].hidden, true);
  assert.equal(describe(s).layers.find((l) => l.id === "end").enabled, false);
  assert.equal(describe(s).layers.find((l) => l.id === "end").locked, true);
});

test("keyframe adds and deletes an animate track (absolute t -> scene-local)", () => {
  const file = setup();
  const s = openSession(file);
  runCommand(s, {
    op: "keyframe",
    layer: "title",
    prop: "opacity",
    t: 0.4,
    value: 1,
    duration: 0.4,
  });
  const track = loadComposition(file).scenes[0].elements[0].animate[0];
  assert.equal(track.prop, "opacity");
  assert.equal(track.to, 1);
  assert.equal(track.start, 0.4);
  assert.equal(track.duration, 0.4);
  runCommand(s, { op: "deleteKeyframe", layer: "title", prop: "opacity" });
  const animate = loadComposition(file).scenes[0].elements[0].animate;
  assert.equal(
    Array.isArray(animate) && animate.some((t) => t.prop === "opacity"),
    false,
  );
});

test("addLayer/duplicate/remove/reorder edit the structured scene", () => {
  const file = setup();
  const s = openSession(file);
  runCommand(s, {
    op: "addLayer",
    scene: "intro",
    id: "caption",
    type: "text",
    text: "New",
    opacity: 0.5,
  });
  runCommand(s, { op: "duplicate", layer: "badge" });
  let comp = loadComposition(file);
  assert.ok(comp.scenes[0].elements.some((e) => e.id === "caption"));
  assert.ok(comp.scenes[0].elements.some((e) => e.id === "badge-copy"));
  runCommand(s, { op: "reorder", layer: "badge-copy", index: 0 });
  comp = loadComposition(file);
  assert.equal(comp.scenes[0].elements[0].id, "badge-copy");
  runCommand(s, { op: "remove", layer: "caption" });
  comp = loadComposition(file);
  assert.equal(
    comp.scenes[0].elements.some((e) => e.id === "caption"),
    false,
  );
});

test("addScene/removeScene and setScene adjust the project tape", () => {
  const file = setup();
  const s = openSession(file);
  runCommand(s, {
    op: "addScene",
    id: "middle",
    duration: 4,
    elements: [{ id: "mid", type: "text", text: "Mid" }],
  });
  let comp = loadComposition(file);
  assert.ok(comp.scenes.some((sc) => sc.id === "middle"));
  assert.equal(comp.duration, 9);
  runCommand(s, { op: "setScene", scene: "middle", duration: 2 });
  comp = loadComposition(file);
  assert.equal(comp.scenes.find((sc) => sc.id === "middle").duration, 2);
  runCommand(s, { op: "removeScene", scene: "middle" });
  comp = loadComposition(file);
  assert.equal(
    comp.scenes.some((sc) => sc.id === "middle"),
    false,
  );
});

test("undo and redo restore the exact prior file snapshot", () => {
  const file = setup();
  const s = openSession(file);
  const before = readFileSync(file, "utf8");
  runCommand(s, { op: "set", layer: "title", prop: "text", value: "changed" });
  const changed = readFileSync(file, "utf8");
  assert.notEqual(before, changed);
  runCommand(s, { op: "undo" });
  assert.equal(readFileSync(file, "utf8"), before);
  runCommand(s, { op: "redo" });
  assert.equal(readFileSync(file, "utf8"), changed);
  runCommand(s, { op: "undo" });
  assert.equal(revisionOf(readFileSync(file, "utf8")), revisionOf(before));
});

test("session ops never dirty the file; describe does not write", () => {
  const file = setup();
  const s = openSession(file);
  const before = readFileSync(file, "utf8");
  runCommand(s, { op: "seek", t: 2 });
  runCommand(s, { op: "select", id: "title" });
  runCommand(s, { op: "workarea", x: 0, y: 0, w: 1280, h: 720 });
  assert.equal(readFileSync(file, "utf8"), before);
  assert.equal(describe(s).playhead, 2);
  assert.deepEqual(describe(s).selection, ["title"]);
  assert.deepEqual(describe(s).workarea, { x: 0, y: 0, w: 1280, h: 720 });
});

test("unknown op and unknown prop fail loudly without writing", () => {
  const file = setup();
  const s = openSession(file);
  const before = readFileSync(file, "utf8");
  assert.throws(
    () => runCommand(s, { op: "explode", layer: "title" }),
    /Unknown op/,
  );
  assert.throws(
    () => runCommand(s, { op: "set", layer: "title", prop: "nope", value: 1 }),
    /Unknown prop/,
  );
  assert.equal(readFileSync(file, "utf8"), before);
});

test("schema documents every op and prop", () => {
  const names = [
    ...opSchema.session.map((o) => o.name),
    ...opSchema.document.map((o) => o.name),
  ];
  for (const name of [
    "describe",
    "seek",
    "select",
    "play",
    "pause",
    "undo",
    "redo",
    "set",
    "keyframe",
    "move",
    "trim",
    "addLayer",
    "remove",
    "addScene",
  ])
    assert.ok(names.includes(name), `schema missing ${name}`);
  assert.ok(opSchema.props.text);
  assert.ok(opSchema.props.enabled);
  assert.ok(opSchema.examples.length >= 3);
});
