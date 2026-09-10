#!/usr/bin/env node
import { stdin, stdout } from "node:process";
import { join, dirname, resolve } from "node:path";
import {
  compileFile,
  describeComposition,
  loadComposition,
  parseMotionMarkdown,
  validateComposition,
} from "../core/index.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const tools = [
  {
    name: "motion_init",
    description: "Create a motion project folder with motion.md and assets.",
    inputSchema: {
      type: "object",
      properties: { dir: { type: "string" } },
      required: ["dir"],
    },
  },
  {
    name: "motion_validate",
    description: "Parse and lint a motion.md file.",
    inputSchema: {
      type: "object",
      properties: { file: { type: "string" } },
      required: ["file"],
    },
  },
  {
    name: "motion_describe",
    description: "Return the parsed timeline as JSON so a model can reason without reading raw HTML.",
    inputSchema: {
      type: "object",
      properties: { file: { type: "string" } },
      required: ["file"],
    },
  },
  {
    name: "motion_compile",
    description: "Compile motion.md to seekable composition.html.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string" },
        out: { type: "string" },
        preview: { type: "boolean" },
      },
      required: ["file"],
    },
  },
  {
    name: "motion_patch",
    description: "Set fields on one element inside a scene. Rewrites only that motion fence when possible.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string" },
        scene: { type: "string" },
        element: { type: "string" },
        set: { type: "object" },
      },
      required: ["file", "scene", "element", "set"],
    },
  },
];

function ok(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function fail(id, message) {
  return { jsonrpc: "2.0", id, error: { code: -32000, message } };
}

function handle(method, params) {
  if (method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "motion", version: "0.1.0" },
      capabilities: { tools: {} },
    };
  }
  if (method === "tools/list") return { tools };
  if (method !== "tools/call") throw new Error(`unknown method ${method}`);

  const name = params.name;
  const a = params.arguments || {};

  if (name === "motion_validate") {
    const comp = loadComposition(a.file);
    return validateComposition(comp);
  }
  if (name === "motion_describe") {
    return describeComposition(loadComposition(a.file));
  }
  if (name === "motion_compile") {
    const out = a.out || join(dirname(resolve(a.file)), "dist", "composition.html");
    const r = compileFile(a.file, out, { preview: a.preview !== false });
    return { outFile: r.outFile, diagnostics: r.diagnostics };
  }
  if (name === "motion_init") {
    return { dir: resolve(a.dir), note: "Use the CLI `motion init` for files; MCP init is a pointer in v0." };
  }
  if (name === "motion_patch") {
    if (!existsSync(a.file)) throw new Error("file not found");
    const md = readFileSync(a.file, "utf8");
    const comp = parseMotionMarkdown(md);
    const scene = comp.scenes.find((s) => s.id === a.scene);
    if (!scene) throw new Error(`scene ${a.scene} not found`);
    const el = scene.elements.find((e) => e.id === a.element);
    if (!el) throw new Error(`element ${a.element} not found`);
    Object.assign(el, a.set);
    // v0: write a sidecar patch so we do not smash markdown formatting
    const patchPath = a.file.replace(/\.md$/, "") + ".patches.json";
    let patches = [];
    if (existsSync(patchPath)) patches = JSON.parse(readFileSync(patchPath, "utf8"));
    patches.push({ scene: a.scene, element: a.element, set: a.set, at: new Date().toISOString() });
    writeFileSync(patchPath, JSON.stringify(patches, null, 2));
    return { ok: true, patchPath, applied: a.set };
  }
  throw new Error(`unknown tool ${name}`);
}

let buf = "";
stdin.setEncoding("utf8");
stdin.on("data", (chunk) => {
  buf += chunk;
  while (true) {
    const idx = buf.indexOf("\n");
    if (idx === -1) break;
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    Promise.resolve()
      .then(() => handle(msg.method, msg.params || {}))
      .then((result) => stdout.write(JSON.stringify(ok(msg.id, result)) + "\n"))
      .catch((err) => stdout.write(JSON.stringify(fail(msg.id, err.message)) + "\n"));
  }
});
