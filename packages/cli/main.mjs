import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  cpSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadComposition,
  validateComposition,
  describeComposition,
  compileFile,
  checkAssets,
} from "../core/index.mjs";
import { startProjectServer } from "../server/project.mjs";
import { inspectFrames, renderVideo } from "../renderer/render.mjs";
import { scoreComposition } from "../core/score.mjs";
import { synthKit } from "../sound/synth.mjs";
import { runGoldTest } from "../gold/test.mjs";
import { captureProduct } from "../capture/capture.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url));
export function listSkills() {
  const directory = join(root, "skills");
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const path = join(directory, entry.name, "SKILL.md");
      if (!existsSync(path)) return null;
      const source = readFileSync(path, "utf8");
      const header = source.match(/^---\s*\n([\s\S]*?)\n---/);
      const name = header?.[1].match(/^name:\s*(.+)$/m)?.[1] || entry.name;
      const description =
        header?.[1].match(/^description:\s*(.+)$/m)?.[1] || "";
      return { name, description, path };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function initProject(dir) {
  dir = resolve(dir);
  if (existsSync(join(dir, "motion.md")))
    throw new Error(
      "motion.md already exists. Choose an empty project directory.",
    );
  if (existsSync(dir) && readdirSync(dir).length)
    throw new Error(
      "Project directory must be empty. Existing files were left unchanged.",
    );
  mkdirSync(dir, { recursive: true });
  cpSync(join(root, "examples/product-launch"), dir, {
    recursive: true,
    force: false,
    errorOnExist: true,
    filter: (src) =>
      !src.includes("/.motioon") &&
      !src.includes("/dist") &&
      !src.endsWith(".mp4") &&
      !src.endsWith(".webm"),
  });
  return { dir, file: join(dir, "motion.md") };
}
function option(argv, name, fallback) {
  const i = argv.indexOf(name);
  if (i < 0) return fallback;
  if (!argv[i + 1] || argv[i + 1].startsWith("--"))
    throw new Error(`Missing value for ${name}`);
  return argv[i + 1];
}
function usage() {
  console.log(`motioon — editable HTML videos for AI agents

  motioon new <directory>                 Create a project
  motioon validate [motion.md]            Validate timing and local assets
  motioon describe [motion.md]            Read the normalized composition
  motioon compile [motion.md] -o <dir>     Write standalone seekable HTML
  motioon studio [motion.md] [--port 4400] [--out video.mp4] Open the local editing studio
  motioon inspect [motion.md] --frames 0,30,60 [-o frames]
  motioon frame [motion.md] 120 [-o out.png]      Render one PNG frame
  motioon render [motion.md] -o out.mp4 [--format mp4|webm]  Export with sound + out.silent.mp4
                 [--quality draft|high] [--workers 2] [--frames 0:60] [--no-cache]
  motioon score [motion.md]               Score an openai-launch composition
  motioon sound synth [motion.md] [--force] Generate a local dry cue kit
  motioon test gold/openai-8s [--review]  Render and compare a frozen gold clip
  motioon test gold/project-capture      Test the captured video pipeline
  motioon test gold/micro-motion-8s       Test cursor, event and behavior choreography
  motioon capture [motion.md] --url URL [--flow flow.json] [--seconds 2]
                 [--out assets/ui/capture.webm] [--id ui.capture]
  motioon skills                         List bundled agent skills
  motioon agent                          Print skill and MCP connection details
  motioon mcp                            Start the MCP server on stdio

Aliases: init/new, lint/validate, dev/preview/studio. Run npm run setup once for Chromium.`);
}
export async function main(argv = process.argv.slice(2)) {
  const cmd = argv[0];
  if (!cmd || ["-h", "--help", "help"].includes(cmd)) return usage();
  if (cmd === "mcp") {
    const { startMcp } = await import("../mcp/server.mjs");
    return startMcp();
  }
  if (cmd === "skills") {
    console.log(JSON.stringify(listSkills(), null, 2));
    return;
  }
  if (cmd === "agent") {
    console.log(
      JSON.stringify(
        {
          skill: join(root, "skills/motion/SKILL.md"),
          skills: listSkills(),
          mcpServers: {
            motioon: {
              command: process.execPath,
              args: [join(root, "packages/mcp/server.mjs")],
            },
          },
          workflow:
            "new → read motion_editor_state → edit via motion_editor_run/batch ops → validate → motion_inspect_frames → fix via ops → render → studio",
        },
        null,
        2,
      ),
    );
    return;
  }
  if (["new", "init"].includes(cmd)) {
    if (!argv[1]) throw new Error("Provide a project directory.");
    console.log(JSON.stringify(initProject(argv[1]), null, 2));
    return;
  }
  if (cmd === "sound" && argv[1] === "synth") {
    const file = resolve(argv[2] || "motion.md");
    console.log(
      JSON.stringify(
        synthKit(dirname(file), { force: argv.includes("--force") }),
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "test") {
    const target = argv[1] || "gold/openai-8s";
    const folder = [
      "gold/openai-8s",
      "gold/project-capture",
      "gold/micro-motion-8s",
    ].includes(target)
      ? join(root, "test", target)
      : resolve(target);
    console.log(
      JSON.stringify(
        await runGoldTest(folder, {
          review: argv.includes("--review"),
          update: argv.includes("--update"),
        }),
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "capture") {
    const target = resolve(
      argv[1] && !argv[1].startsWith("-") ? argv[1] : "motion.md",
    );
    const result = await captureProduct(target, {
      url: option(argv, "--url", undefined),
      flow: option(argv, "--flow", undefined),
      seconds: Number(option(argv, "--seconds", 2)),
      out: option(argv, "--out", "assets/ui/capture.webm"),
      id: option(argv, "--id", "ui.capture"),
      width: Number(option(argv, "--width", 1440)),
      height: Number(option(argv, "--height", 900)),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const file = resolve(
    argv[1] && !argv[1].startsWith("-") ? argv[1] : "motion.md",
  );
  if (["lint", "validate"].includes(cmd)) {
    const comp = loadComposition(file),
      d = validateComposition(comp);
    try {
      checkAssets(comp);
    } catch (e) {
      d.errors.push(e.message);
      d.ok = false;
    }
    console.log(JSON.stringify(d, null, 2));
    if (!d.ok) process.exitCode = 1;
    return;
  }
  if (cmd === "describe") {
    console.log(
      JSON.stringify(describeComposition(loadComposition(file)), null, 2),
    );
    return;
  }
  if (cmd === "score") {
    const result = scoreComposition(loadComposition(file));
    if (!result) throw new Error("Scoring requires recipe: openai-launch.");
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (cmd === "compile") {
    const out = join(
      resolve(option(argv, "-o", join(dirname(file), "dist"))),
      "composition.html",
    );
    const r = compileFile(file, out);
    console.log(
      JSON.stringify({ out: r.outFile, diagnostics: r.diagnostics }, null, 2),
    );
    return;
  }
  if (["dev", "preview", "studio"].includes(cmd)) {
    const service = await startProjectServer(file, {
      port: Number(option(argv, "--port", 4400)),
      studio: true,
      out: option(argv, "--out", undefined),
    });
    console.log(`Motioon Studio → ${service.url}\nProject: ${file}`);
    if (option(argv, "--out", undefined))
      console.log(`Video         → ${service.url}/out`);
    for (const sig of ["SIGINT", "SIGTERM"])
      process.once(sig, async () => {
        await service.close();
        process.exit(0);
      });
    return;
  }
  if (cmd === "inspect") {
    const frames = String(option(argv, "--frames", "0"))
      .split(",")
      .map(Number);
    const result = await inspectFrames(file, {
      frames,
      outDir: resolve(
        option(argv, "-o", join(dirname(file), ".motioon", "inspect")),
      ),
    });
    console.log(
      JSON.stringify(
        result.map(({ buffer, ...r }) => r),
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "frame") {
    const numeric = (s) => Number.isInteger(Number(s)) && Number(s) >= 0;
    const hasFile = argv[1] && !argv[1].startsWith("-") && !numeric(argv[1]);
    const localFile = resolve(hasFile ? argv[1] : "motion.md");
    const index = Number(hasFile ? argv[2] : argv[1]);
    if (!Number.isInteger(index) || index < 0)
      throw new Error("Provide a frame index, e.g. motioon frame 120.");
    const out = resolve(
      option(
        argv,
        "-o",
        join(dirname(localFile), ".motioon", `frame-${index}.png`),
      ),
    );
    const [result] = await inspectFrames(localFile, { frames: [index] });
    writeFileSync(out, result.buffer);
    console.log(
      JSON.stringify(
        {
          out,
          frame: result.frame,
          time: result.time,
          overflow: result.overflow,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "render") {
    const range = option(argv, "--frames", undefined)?.split(":").map(Number);
    if (range && range.length !== 2)
      throw new Error("Use --frames start:end (end exclusive).");
    const result = await renderVideo(file, {
      out: option(argv, "-o", undefined),
      format: option(argv, "--format", undefined),
      quality: option(argv, "--quality", "high"),
      workers: Number(option(argv, "--workers", 2)),
      from: range?.[0],
      to: range?.[1],
      cache: !argv.includes("--no-cache"),
      onProgress: (p) => {
        if (process.stderr.isTTY)
          process.stderr.write(
            `\rRendering ${Math.round(p.progress * 100)}% · ${p.frames}/${p.total} frames`,
          );
      },
    });
    if (process.stderr.isTTY) process.stderr.write("\n");
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  throw new Error(`Unknown command '${cmd}'. Run motioon --help.`);
}
