import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { inspectFrames, runFfmpeg } from "../packages/renderer/render.mjs";

test("cataloged video layers seek to the correct source frame", async () => {
  const dir = mkdtempSync(join(tmpdir(), "motioon-video-"));
  try {
    mkdirSync(join(dir, "assets"));
    const clip = join(dir, "assets", "ui.webm");
    await runFfmpeg([
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=red:s=320x180:r=24:d=1",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=320x180:r=24:d=1",
      "-filter_complex",
      "[0:v][1:v]concat=n=2:v=1:a=0[v]",
      "-map",
      "[v]",
      "-c:v",
      "libvpx-vp9",
      "-pix_fmt",
      "yuv420p",
      clip,
    ]);
    writeFileSync(
      join(dir, "assets", "catalog.json"),
      JSON.stringify({ ui: { src: "assets/ui.webm", kind: "video", dur: 2 } }),
    );
    const file = join(dir, "motion.md");
    writeFileSync(
      file,
      `---\nversion: 1\nwidth: 320\nheight: 180\nfps: 24\nduration: 2\ncatalog: ./assets/catalog.json\n---\n\n## scene: ui\n\`\`\`motion\nkind: ui\nduration: 2\nelements:\n  - id: product\n    type: video\n    src: asset:ui\n    x: 50%\n    y: 50%\n    w: 320\n    h: 180\n\`\`\`\n`,
    );
    const frames = await inspectFrames(file, { frames: [6, 30] });
    const pixel = async (png) =>
      await runFfmpeg(
        [
          "-f",
          "image2pipe",
          "-vcodec",
          "png",
          "-i",
          "pipe:0",
          "-vf",
          "crop=1:1:160:90",
          "-f",
          "rawvideo",
          "-pix_fmt",
          "rgb24",
          "pipe:1",
        ],
        { input: (stdin) => stdin.write(png) },
      );
    const red = await pixel(frames[0].buffer);
    const blue = await pixel(frames[1].buffer);
    assert.ok(
      red[0] > 180 && red[2] < 80,
      `first frame should be red: ${[...red]}`,
    );
    assert.ok(
      blue[2] > 180 && blue[0] < 80,
      `second frame should be blue: ${[...blue]}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("micro-motion cursor, mask and event frames are deterministic out of order", async () => {
  const file = new URL("./gold/micro-motion-8s/motion.md", import.meta.url)
    .pathname;
  const frames = await inspectFrames(file, { frames: [36, 27, 36, 12, 40] });
  const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
  assert.equal(digest(frames[0].buffer), digest(frames[2].buffer));
  assert.notEqual(digest(frames[1].buffer), digest(frames[4].buffer));
  assert.notEqual(digest(frames[3].buffer), digest(frames[0].buffer));
});

test("banger example types and tilts from timeline time", async () => {
  const file = new URL("../examples/banger-8s/motion.md", import.meta.url)
    .pathname;
  const frames = await inspectFrames(file, { frames: [82, 53, 82] });
  const typed = (frame) => frame.elements.find((el) => el.id === "typed")?.text;
  assert.equal(typed(frames[0]), "Q4 plan");
  assert.equal(typed(frames[1]), "");
  const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
  assert.equal(digest(frames[0].buffer), digest(frames[2].buffer));
});

test("Sunset film seeks typing, site interactions, project page and brand lockup", async () => {
  const file = new URL("../examples/sunset-idea-8s/motion.md", import.meta.url)
    .pathname;
  const frames = await inspectFrames(file, {
    frames: [18, 48, 76, 96, 170, 228, 275, 310, 18],
  });
  const element = (frame, id) => frame.elements.find((el) => el.id === id);
  assert.match(element(frames[0], "software-typed").text, /^Buy/);
  assert.equal(
    element(frames[1], "software-typed").text,
    "Buy and sell software.",
  );
  assert.equal(element(frames[2], "list-button-selected").visible, true);
  assert.equal(element(frames[3], "real-homepage").visible, true);
  assert.equal(element(frames[4], "nomo-hover").visible, true);
  assert.equal(element(frames[5], "real-nomo-page").visible, true);
  assert.equal(
    element(frames[6], "changes-hands-line").text,
    "Software changes hands.",
  );
  assert.equal(element(frames[7], "sunset-lockup").visible, true);
  const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
  assert.notEqual(digest(frames[3].buffer), digest(frames[4].buffer));
  assert.equal(digest(frames[0].buffer), digest(frames[8].buffer));
});
