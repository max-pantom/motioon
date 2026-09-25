import { chromium } from "playwright";
import ffmpegStatic from "ffmpeg-static";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, resolve, join, extname } from "node:path";
import { once } from "node:events";
import {
  loadComposition,
  checkAssets,
  projectPath,
  compileToHtml,
} from "../core/index.mjs";
import { assertValid } from "../core/validate.mjs";
import { resolveSrc } from "../core/compile.mjs";
import { startProjectServer } from "../server/project.mjs";
export const launchBrowser = () =>
  chromium.launch({
    headless: true,
    ...(process.env.MOTIOON_CHROMIUM
      ? { executablePath: process.env.MOTIOON_CHROMIUM }
      : {}),
  });
export const ffmpegPath = process.env.MOTIOON_FFMPEG || ffmpegStatic;

export function buildAudioFilterComplex(
  comp,
  from = 0,
  to = comp.duration * comp.fps,
) {
  const filters = [];
  const groups = { voice: [], bed: [], sting: [], other: [] };
  const mix = (labels, out) => {
    if (!labels.length) return null;
    filters.push(
      labels.length === 1
        ? `${labels[0]}anull[${out}]`
        : `${labels.join("")}amix=inputs=${labels.length}:duration=longest:normalize=0[${out}]`,
    );
    return `[${out}]`;
  };
  comp.audio.forEach((a, i) => {
    const duration = a.duration;
    const parts = [
      `[${i + 1}:a]atrim=start=${a.trim}${duration != null ? `:duration=${duration}` : ""}`,
      "asetpts=PTS-STARTPTS",
    ];
    if (a.fade_in > 0) parts.push(`afade=t=in:st=0:d=${a.fade_in}`);
    if (a.fade_out > 0 && duration != null)
      parts.push(
        `afade=t=out:st=${Math.max(0, duration - a.fade_out)}:d=${a.fade_out}`,
      );
    parts.push(`volume=${a.volume * 10 ** (a.gain_db / 20)}`);
    parts.push(`adelay=${Math.round(a.at * 1000)}:all=1`);
    const label = `track${i}`;
    filters.push(`${parts.join(",")}[${label}]`);
    const bucket =
      a.kind === "voice"
        ? "voice"
        : ["music", "room"].includes(a.kind)
          ? "bed"
          : a.kind === "sting"
            ? "sting"
            : "other";
    groups[bucket].push(`[${label}]`);
  });
  const voice = mix(groups.voice, "voices");
  const bed = mix(groups.bed, "beds");
  const sting = mix(groups.sting, "stings");
  const other = mix(groups.other, "others");
  const finalInputs = [];
  if (voice && bed) {
    filters.push(`${voice}asplit=2[voice_side][voice_mix]`);
    filters.push(
      `${bed}[voice_side]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=250[ducked]`,
    );
    finalInputs.push("[ducked]", "[voice_mix]");
  } else {
    if (bed) finalInputs.push(bed);
    if (voice) finalInputs.push(voice);
  }
  if (sting) finalInputs.push(sting);
  if (other) finalInputs.push(other);
  const mixed = mix(finalInputs, "premaster");
  const start = from / comp.fps;
  const duration = (to - from) / comp.fps;
  filters.push(
    `${mixed}atrim=start=${start}:duration=${duration},asetpts=PTS-STARTPTS,apad,loudnorm=I=${comp.audioMaster.lufs}:TP=${comp.audioMaster.peak}:LRA=11,aresample=${comp.audioMaster.sample_rate}[audio]`,
  );
  return filters.join(";");
}
export function runFfmpeg(args, { input } = {}) {
  return new Promise((yes, no) => {
    const proc = spawn(
      ffmpegPath,
      ["-hide_banner", "-loglevel", "error", ...args],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stderr = "",
      stdout = [];
    proc.on("error", no);
    proc.stderr.on("data", (b) => {
      stderr = (stderr + b).slice(-16000);
    });
    proc.stdout.on("data", (b) => stdout.push(b));
    proc.stdin.on("error", () => {});
    proc.on("close", (code) =>
      code === 0
        ? yes(Buffer.concat(stdout))
        : no(new Error(`FFmpeg failed (${code}): ${stderr}`)),
    );
    if (input)
      Promise.resolve(input(proc.stdin))
        .then(() => proc.stdin.end())
        .catch((e) => {
          proc.kill();
          no(e);
        });
    else proc.stdin.end();
  });
}
function fingerprint(root, html, browserVersion) {
  const hash = createHash("sha256")
    .update(html)
    .update(browserVersion)
    .update(process.platform + process.arch);
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (
        [
          ".motioon",
          "node_modules",
          "dist",
          ".git",
          "test-results",
          "expected",
        ].includes(ent.name) ||
        ent.name.endsWith(".tmp") ||
        /\.(mp4|webm)\.json$/.test(ent.name)
      )
        continue;
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && ![".mp4", ".webm"].includes(extname(p))) {
        hash.update(p.slice(root.length)).update(readFileSync(p));
      }
    }
  }
  walk(root);
  return hash.digest("hex").slice(0, 24);
}
async function openPage(browser, url, comp) {
  const page = await browser.newPage({
    viewport: { width: comp.width, height: comp.height },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(
        `Asset request failed: ${response.url()} (${response.status()})`,
      );
  });
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.origin === url || ["data:", "blob:"].includes(u.protocol))
      return route.continue();
    errors.push(
      `External resource blocked: ${u.href}. Download assets into the project.`,
    );
    return route.abort();
  });
  await page.goto(url + "/composition.html", { waitUntil: "load" });
  await page.evaluate(async () => {
    await window.motion.ready;
  });
  if (errors.length) throw new Error(errors.join("\n"));
  return { page, errors };
}
export async function inspectFrames(
  file,
  { frames = [0], outDir, onProgress } = {},
) {
  const comp = loadComposition(file);
  assertValid(comp);
  checkAssets(comp);
  const total = Math.ceil(comp.duration * comp.fps);
  if (
    !frames.length ||
    frames.length > 24 ||
    frames.some((f) => !Number.isInteger(f) || f < 0 || f >= total)
  )
    throw new Error(`Choose 1–24 frame indices between 0 and ${total - 1}.`);
  const service = await startProjectServer(file, { snapshot: comp });
  let browser;
  try {
    browser = await launchBrowser();
    const { page, errors } = await openPage(browser, service.url, comp);
    const results = [];
    for (const frame of frames) {
      await page.evaluate((t) => motion.seekAsync(t), frame / comp.fps);
      const buffer = await page.screenshot({
        type: "png",
        animations: "allow",
      });
      const elements = await page.evaluate(() => motion.getElements());
      if (errors.length) throw new Error(errors.join("\n"));
      let path;
      if (outDir) {
        mkdirSync(outDir, { recursive: true });
        path = resolve(outDir, `frame-${String(frame).padStart(6, "0")}.png`);
        writeFileSync(path, buffer);
      }
      results.push({
        frame,
        time: frame / comp.fps,
        path,
        buffer,
        elements,
        overflow: elements.filter((e) => e.visible && e.overflow),
      });
    }
    return results;
  } finally {
    await browser?.close();
    await service.close();
  }
}
export async function renderVideo(
  file,
  {
    out,
    format,
    quality = "high",
    workers = 2,
    from = 0,
    to,
    cache = true,
    onProgress = () => {},
  } = {},
) {
  const started = performance.now(),
    comp = loadComposition(file);
  assertValid(comp);
  checkAssets(comp);
  format = format || (out ? extname(out).slice(1) : "mp4");
  if (!["mp4", "webm"].includes(format))
    throw new Error("Format must be mp4 or webm.");
  if (!["draft", "high"].includes(quality))
    throw new Error("Quality must be draft or high.");
  if (comp.width % 2 || comp.height % 2)
    throw new Error("Video export requires even width and height.");
  if (!Number.isInteger(workers) || workers < 1 || workers > 8)
    throw new Error("Workers must be an integer from 1 to 8.");
  const total = Math.ceil(comp.duration * comp.fps);
  to = to ?? total;
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to > total ||
    from >= to
  )
    throw new Error(`Frame range must be within 0:${total} (end exclusive).`);
  out = resolve(out || join(dirname(file), `out.${format}`));
  if (extname(out) !== "." + format)
    throw new Error("Output extension must match the format.");
  mkdirSync(dirname(out), { recursive: true });
  const temp = out + `.${randomUUID()}.tmp.${format}`;
  const silentOut = out.slice(0, -extname(out).length) + `.silent.${format}`;
  const silentTemp = silentOut + `.${randomUUID()}.tmp.${format}`;
  const service = await startProjectServer(file, { snapshot: comp });
  let browser;
  try {
    browser = await launchBrowser();
    const html = compileToHtml(comp),
      key = fingerprint(dirname(resolve(file)), html, browser.version());
    const cacheDir = resolve(dirname(file), ".motioon", "frames", key);
    mkdirSync(cacheDir, { recursive: true });
    let next = from,
      done = 0,
      hits = 0,
      failed = false;
    const paths = new Map();
    const work = async () => {
      let page, errors;
      try {
        while (!failed) {
          const frame = next++;
          if (frame >= to) break;
          const path = join(cacheDir, `${String(frame).padStart(8, "0")}.png`);
          paths.set(frame, path);
          if (cache && existsSync(path) && statSync(path).size > 0) hits++;
          else {
            if (!page)
              ({ page, errors } = await openPage(browser, service.url, comp));
            await page.evaluate((t) => motion.seekAsync(t), frame / comp.fps);
            const bytes = await page.screenshot({
              type: "png",
              animations: "allow",
            });
            if (errors.length) throw new Error(errors.join("\n"));
            const pending = path + "." + randomUUID() + ".tmp";
            writeFileSync(pending, bytes);
            renameSync(pending, path);
          }
          done++;
          onProgress({
            progress: (done / (to - from)) * 0.9,
            frames: done,
            total: to - from,
            cached: hits,
          });
        }
      } catch (e) {
        failed = true;
        throw e;
      } finally {
        await page?.close();
      }
    };
    const outcomes = await Promise.allSettled(
      Array.from({ length: Math.min(workers, to - from) }, work),
    );
    const error = outcomes.find((r) => r.status === "rejected");
    if (error) throw error.reason;
    const args = [
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(comp.fps),
      "-vcodec",
      "png",
      "-i",
      "pipe:0",
    ];
    for (const a of comp.audio)
      args.push(
        "-i",
        projectPath(dirname(comp.sourcePath), resolveSrc(a.src, comp.assets)),
      );
    if (comp.audio.length) {
      args.push(
        "-filter_complex",
        buildAudioFilterComplex(comp, from, to),
        "-map",
        "0:v",
        "-map",
        "[audio]",
      );
    } else
      args.push(
        "-f",
        "lavfi",
        "-i",
        `anullsrc=channel_layout=stereo:sample_rate=${comp.audioMaster.sample_rate}`,
        "-map",
        "0:v",
        "-map",
        "1:a",
      );
    if (format === "mp4")
      args.push(
        "-c:v",
        "libx264",
        "-preset",
        quality === "draft" ? "ultrafast" : "fast",
        "-crf",
        quality === "draft" ? "26" : "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
      );
    else
      args.push(
        "-c:v",
        "libvpx-vp9",
        "-deadline",
        "realtime",
        "-cpu-used",
        "6",
        "-crf",
        quality === "draft" ? "38" : "24",
        "-b:v",
        "0",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "libopus",
      );
    args.push("-t", String((to - from) / comp.fps), temp);
    await runFfmpeg(args, {
      input: async (stdin) => {
        for (let f = from; f < to; f++) {
          if (!stdin.write(readFileSync(paths.get(f))))
            await once(stdin, "drain");
        }
      },
    });
    renameSync(temp, out);
    await runFfmpeg([
      "-y",
      "-i",
      out,
      "-map",
      "0:v:0",
      "-c:v",
      "copy",
      "-an",
      silentTemp,
    ]);
    renameSync(silentTemp, silentOut);
    onProgress({
      progress: 1,
      frames: to - from,
      total: to - from,
      cached: hits,
    });
    const result = {
      out,
      withSound: out,
      withoutSound: silentOut,
      audioCues: comp.audio.length,
      format,
      width: comp.width,
      height: comp.height,
      fps: comp.fps,
      frames: to - from,
      from,
      to,
      duration: (to - from) / comp.fps,
      cachedFrames: hits,
      seconds: Number(((performance.now() - started) / 1000).toFixed(2)),
    };
    writeFileSync(out + ".json", JSON.stringify(result, null, 2));
    return result;
  } finally {
    await browser?.close();
    await service.close();
    rmSync(temp, { force: true });
    rmSync(silentTemp, { force: true });
  }
}
