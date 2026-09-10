#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  loadComposition,
  validateComposition,
  describeComposition,
  compileFile,
  checkAssets,
} from "../core/index.mjs";
import { patchFile } from "../core/patch.mjs";
import { renderVideo, inspectFrames } from "../renderer/render.mjs";
import { startProjectServer } from "../server/project.mjs";
const text = (value) => ({
  content: [
    {
      type: "text",
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});
export function createMcpServer() {
  const server = new McpServer({ name: "motioon", version: "0.2.0" }),
    previews = new Map();
  const register = (name, description, inputSchema, callback) =>
    server.registerTool(name, { description, inputSchema }, async (args) => {
      try {
        return await callback(args);
      } catch (error) {
        return { ...text(error.message), isError: true };
      }
    });
  const file = { file: z.string().describe("Absolute path to motion.md") };
  register(
    "motion_init",
    "Create an editable video project with a working example.",
    { dir: z.string() },
    async (a) => {
      const { initProject } = await import("../cli/main.mjs");
      return text(initProject(a.dir));
    },
  );
  register(
    "motion_read_spec",
    "Read the motion.md format and deterministic runtime API.",
    {},
    () => text(readFileSync(new URL("../../SPEC.md", import.meta.url), "utf8")),
  );
  register(
    "motion_validate",
    "Validate the project, timing, asset references and files.",
    file,
    (a) => {
      const comp = loadComposition(a.file),
        result = validateComposition(comp);
      try {
        checkAssets(comp);
      } catch (e) {
        result.errors.push(e.message);
        result.ok = false;
      }
      return text(result);
    },
  );
  register(
    "motion_describe",
    "Read the normalized timeline, elements and assets.",
    file,
    (a) => text(describeComposition(loadComposition(a.file))),
  );
  register(
    "motion_list_assets",
    "List declared local assets with types and paths.",
    file,
    (a) => text(loadComposition(a.file).assetInfo),
  );
  register(
    "motion_compile",
    "Compile a valid composition into seekable HTML.",
    { ...file, out: z.string().optional() },
    (a) => {
      const result = compileFile(
        a.file,
        a.out || join(dirname(resolve(a.file)), "dist", "composition.html"),
      );
      return text({ out: result.outFile, diagnostics: result.diagnostics });
    },
  );
  register(
    "motion_patch",
    "Persist structured scene or element fields directly to motion.md. HTML scenes use source editing.",
    {
      ...file,
      scene: z.string().optional(),
      element: z.string().optional(),
      set: z.record(z.unknown()),
      revision: z.string().optional(),
    },
    (a) => text(patchFile(a.file, a)),
  );
  register(
    "motion_inspect_frames",
    "Capture up to 24 exact frames as PNG images, with element bounds and overflow diagnostics.",
    {
      ...file,
      frames: z.array(z.number().int().nonnegative()).min(1).max(24),
      outDir: z.string().optional(),
    },
    async (a) => {
      const results = await inspectFrames(a.file, a);
      return {
        content: results.flatMap(({ buffer, ...info }) => [
          { type: "text", text: JSON.stringify(info) },
          {
            type: "image",
            data: buffer.toString("base64"),
            mimeType: "image/png",
          },
        ]),
      };
    },
  );
  register(
    "motion_detect_overflow",
    "Inspect visible elements outside the canvas at chosen frames.",
    { ...file, frames: z.array(z.number().int().nonnegative()).min(1).max(24) },
    async (a) =>
      text(
        (await inspectFrames(a.file, a)).map((r) => ({
          frame: r.frame,
          overflow: r.overflow,
        })),
      ),
  );
  register(
    "motion_render",
    "Render an MP4 or WebM video using deterministic frame capture. Range end is exclusive.",
    {
      ...file,
      out: z.string().optional(),
      format: z.enum(["mp4", "webm"]).optional(),
      quality: z.enum(["draft", "high"]).optional(),
      workers: z.number().int().min(1).max(8).optional(),
      from: z.number().int().nonnegative().optional(),
      to: z.number().int().positive().optional(),
    },
    async (a) => text(await renderVideo(a.file, a)),
  );
  register(
    "motion_preview",
    "Open a local editable Studio server and return its URL.",
    file,
    async (a) => {
      const key = resolve(a.file);
      if (!previews.has(key))
        previews.set(key, await startProjectServer(key, { studio: true }));
      return text({ url: previews.get(key).url });
    },
  );
  const close = server.close.bind(server);
  server.close = async () => {
    await Promise.all([...previews.values()].map((p) => p.close()));
    await close();
  };
  return server;
}
export async function startMcp() {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
  for (const sig of ["SIGINT", "SIGTERM"])
    process.once(sig, () => server.close().then(() => process.exit(0)));
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await startMcp();
