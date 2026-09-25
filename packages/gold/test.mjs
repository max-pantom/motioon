import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  loadComposition,
  validateComposition,
  describeComposition,
  checkAssets,
} from "../core/index.mjs";
import { scoreComposition } from "../core/score.mjs";
import { inspectFrames, renderVideo, ffmpegPath } from "../renderer/render.mjs";
import { synthKit } from "../sound/synth.mjs";

const frameNumbers = [0, 24, 60, 120, 180];
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const json = (value) => JSON.stringify(value, null, 2) + "\n";

function measureAudio(file) {
  return new Promise((resolveMeasure, reject) => {
    const proc = spawn(
      ffmpegPath,
      [
        "-hide_banner",
        "-i",
        file,
        "-vn",
        "-filter_complex",
        "ebur128=peak=true",
        "-f",
        "null",
        "-",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code)
        return reject(
          new Error(`Audio measurement failed: ${stderr.slice(-1000)}`),
        );
      const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
      const lufs = Number(
        summary.match(/Integrated loudness:[\s\S]*?I:\s*([\d.-]+)/)?.[1],
      );
      const truePeak = Number(
        summary.match(/True peak:[\s\S]*?Peak:\s*([\d.-]+)/)?.[1],
      );
      resolveMeasure({ lufs, truePeak });
    });
  });
}

function compareFrame(expected, actual) {
  return new Promise((resolveComparison, reject) => {
    const proc = spawn(
      ffmpegPath,
      [
        "-hide_banner",
        "-i",
        expected,
        "-i",
        actual,
        "-lavfi",
        "psnr",
        "-f",
        "null",
        "-",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code)
        return reject(
          new Error(`Frame comparison failed: ${stderr.slice(-1000)}`),
        );
      const score = Number(
        [...stderr.matchAll(/average:\s*([\d.]+)/g)].at(-1)?.[1],
      );
      resolveComparison(Number.isFinite(score) ? score : Infinity);
    });
  });
}

export async function runGoldTest(
  folder,
  { update = false, review = false } = {},
) {
  folder = resolve(folder);
  const file = join(folder, "motion.md");
  const expected = join(folder, "expected");
  const output = join(folder, ".motioon", "gold.mp4");
  const catalog = join(folder, "assets", "catalog.json");
  if (!existsSync(catalog)) synthKit(folder);
  const comp = loadComposition(file);
  const diagnostics = validateComposition(comp);
  checkAssets(comp);
  const score = scoreComposition(comp);
  const problems = [...diagnostics.errors];
  if (!score?.ok)
    problems.push(
      `Taste score ${score?.score ?? 0}/10 is below 8/10 or a critical check failed.`,
    );
  if (
    comp.width !== 1920 ||
    comp.height !== 1080 ||
    comp.fps !== 24 ||
    Math.abs(comp.duration - 8) > 1 / comp.fps
  )
    problems.push("Gold composition must be 1920×1080, 24 fps and 8 seconds.");
  if (
    comp.scenes[0]?.elements.filter((el) =>
      ["text", "caption"].includes(el.type),
    ).length > 0
  )
    problems.push("Frame zero must start without copy.");
  for (const [index, scene] of comp.scenes.entries()) {
    if (
      index &&
      !comp.audio.some(
        (a) =>
          a.kind === "sting" && Math.abs(a.at - scene.start) <= 1 / comp.fps,
      )
    )
      problems.push(`Missing sting at cut ${scene.start}s.`);
  }
  const stings = comp.audio
    .filter((a) => a.kind === "sting")
    .sort((a, b) => a.at - b.at);
  if (stings.some((a, i) => i && a.at - stings[i - 1].at < 0.08))
    problems.push("Stings are closer than 80ms.");
  if (comp.audio.some((a) => a.kind === "music" && a.gain_db > -22))
    problems.push("Music exceeds -22dB.");
  if (problems.length) throw new Error(problems.join("\n"));

  const rendered = await renderVideo(file, { out: output, quality: "draft" });
  const firstCutFrame = Math.ceil(comp.scenes[1].start * comp.fps);
  const captured = await inspectFrames(file, {
    frames: [...new Set([...frameNumbers, firstCutFrame])].sort(
      (a, b) => a - b,
    ),
    outDir: join(folder, ".motioon", "gold-frames"),
  });
  const frames = captured.filter((frame) => frameNumbers.includes(frame.frame));
  const audio = await measureAudio(output);
  if (Math.abs(audio.lufs + 16) > 1.5)
    problems.push(
      `Integrated loudness ${audio.lufs} LUFS is outside -16 ±1.5.`,
    );
  if (audio.truePeak > -1)
    problems.push(`True peak ${audio.truePeak} dBFS exceeds -1.`);
  if (
    hash(frames[0].buffer) ===
    hash(captured.find((frame) => frame.frame === firstCutFrame).buffer)
  )
    problems.push("First cut did not change the picture.");
  if (problems.length) throw new Error(problems.join("\n"));

  const describe = describeComposition(comp);
  const cues = comp.audio.map(({ id, kind, src, at, gain_db }) => ({
    id,
    kind,
    src,
    at,
    gain_db,
  }));
  const manifest = {
    frames: Object.fromEntries(
      frames.map((frame) => [frame.frame, hash(frame.buffer)]),
    ),
  };
  const actual = { describe, cues, score, manifest };
  const files = {
    describe: "describe.json",
    cues: "mix.cues.json",
    score: "score.json",
    manifest: "frames.json",
  };
  if (update) {
    mkdirSync(expected, { recursive: true });
    for (const [key, name] of Object.entries(files))
      writeFileSync(join(expected, name), json(actual[key]));
    mkdirSync(join(expected, "frames"), { recursive: true });
    for (const frame of frames)
      writeFileSync(
        join(expected, "frames", `${String(frame.frame).padStart(3, "0")}.png`),
        frame.buffer,
      );
  } else {
    for (const [key, name] of Object.entries(files)) {
      if (key === "manifest") continue;
      const path = join(expected, name);
      if (!existsSync(path) || json(actual[key]) !== readFileSync(path, "utf8"))
        problems.push(`${name} differs from frozen expected output.`);
    }
    for (const frame of frames) {
      const path = join(
        expected,
        "frames",
        `${String(frame.frame).padStart(3, "0")}.png`,
      );
      if (!existsSync(path))
        problems.push(`Frozen frame ${frame.frame} is missing.`);
      else if (hash(readFileSync(path)) !== hash(frame.buffer)) {
        const psnr = await compareFrame(path, frame.path);
        if (psnr < 40)
          problems.push(
            `Frame ${frame.frame} differs from expected PNG (${psnr.toFixed(1)} dB PSNR).`,
          );
      }
    }
  }
  if (problems.length) throw new Error(problems.join("\n"));
  let reviewFile;
  if (review) {
    reviewFile = join(folder, ".motioon", "review.html");
    writeFileSync(
      reviewFile,
      `<!doctype html><meta charset="utf-8"><title>Motioon gold review</title><style>body{font:15px system-ui;background:#111;color:white;margin:32px}video{width:min(960px,100%);display:block;margin-bottom:24px}.frames{display:flex;gap:12px;overflow:auto}.frames figure{margin:0;min-width:280px}.frames img{width:100%}figcaption{padding:8px 0;color:#aaa}</style><h1>openai-8s · ${score.score}/10</h1><video controls src="gold.mp4"></video><div class="frames">${frames.map((frame) => `<figure><img src="gold-frames/frame-${String(frame.frame).padStart(6, "0")}.png"><figcaption>${frame.time.toFixed(2)}s · frame ${frame.frame}</figcaption></figure>`).join("")}</div>`,
    );
    if (process.platform === "darwin")
      spawn("open", [reviewFile], { detached: true, stdio: "ignore" }).unref();
  }
  return {
    ok: true,
    score: score.score,
    audio,
    video: rendered.out,
    review: reviewFile,
  };
}
