import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compileFile, describeComposition, loadComposition, validateComposition } from "../core/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

function usage() {
  console.log(`motion — HTML video from motion.md

  motion init <dir>
  motion lint <file>
  motion describe <file>
  motion compile <file> -o <dir>
  motion preview <file> [--port 4400]
  motion render <file> -o out.mp4 [--quality draft|high]

Render is specified, not faked. compile + preview work now.
`);
}

function arg(flag, argv, fallback) {
  const i = argv.indexOf(flag);
  if (i === -1) return fallback;
  return argv[i + 1];
}

function initDir(dir) {
  mkdirSync(join(dir, "assets"), { recursive: true });
  const sample = readFileSync(join(root, "examples/product-launch/motion.md"), "utf8");
  const target = join(dir, "motion.md");
  if (!existsSync(target)) writeFileSync(target, sample);
  const mark = readFileSync(join(root, "examples/product-launch/assets/mark.svg"), "utf8");
  writeFileSync(join(dir, "assets/mark.svg"), mark);
  console.log(`initialized ${dir}`);
}

async function preview(file, port) {
  const out = join(dirname(resolve(file)), "dist", "composition.html");
  const { diagnostics } = compileFile(file, out, { preview: true });
  printDiagnostics(diagnostics);
  const html = readFileSync(out);
  const server = createServer((req, res) => {
    if (req.url === "/" || req.url === "/index.html" || req.url === "/composition.html") {
      const fresh = compileFile(file, out, { preview: true });
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(readFileSync(fresh.outFile));
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });
  await new Promise((resolvePromise) => server.listen(port, resolvePromise));
  console.log(`preview  http://127.0.0.1:${port}`);
  console.log(`file     ${out}`);
}

function printDiagnostics(d) {
  for (const e of d.errors) console.error("error  " + e);
  for (const w of d.warnings) console.warn("warn   " + w);
  if (!d.ok) process.exitCode = 1;
}

export async function main(argv = process.argv.slice(2)) {
  const cmd = argv[0];
  if (!cmd || cmd === "-h" || cmd === "--help") return usage();

  if (cmd === "init") {
    if (!argv[1]) return usage();
    return initDir(resolve(argv[1]));
  }

  const file = argv[1];
  if (!file) return usage();

  if (cmd === "lint") {
    const comp = loadComposition(file);
    const d = validateComposition(comp);
    printDiagnostics(d);
    if (d.ok) console.log(`ok  ${comp.scenes.length} scenes, ${comp.duration}s, ${comp.width}x${comp.height}`);
    return;
  }

  if (cmd === "describe") {
    const comp = loadComposition(file);
    console.log(JSON.stringify(describeComposition(comp), null, 2));
    return;
  }

  if (cmd === "compile") {
    const outDir = resolve(arg("-o", argv, join(dirname(resolve(file)), "dist")));
    const outFile = join(outDir, "composition.html");
    const { diagnostics } = compileFile(file, outFile, { preview: true });
    printDiagnostics(diagnostics);
    console.log(`wrote ${outFile}`);
    return;
  }

  if (cmd === "preview") {
    const port = Number(arg("--port", argv, 4400));
    return preview(file, port);
  }

  if (cmd === "render") {
    const out = arg("-o", argv, "out.mp4");
    const quality = arg("--quality", argv, "draft");
    const outFile = join(dirname(resolve(file)), "dist", "composition.html");
    compileFile(file, outFile, { preview: false });
    console.error(`render is not wired yet.
Compiled seekable HTML:
  ${outFile}

Next engine (pick one):
  1. htmlrec:   hrec render ${outFile} -o ${out} --fps 30 --width ...
  2. hyperframes after an adapter pass
  3. packages/renderer using CDP beginFrame + ffmpeg stdin

Quality requested: ${quality}
Seek hook: window.__motion.seek(seconds)`);
    process.exitCode = 2;
    return;
  }

  usage();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
