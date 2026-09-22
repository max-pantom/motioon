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
  compileFile,
  checkAssets,
} from "../core/index.mjs";
import { renderVideo, inspectFrames } from "../renderer/render.mjs";
import {
  sessionFor,
  runCommand,
  describe,
  opSchema,
} from "../editor/editor.mjs";
const text = (value) => ({
  content: [
    {
      type: "text",
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});
const commandFields = {
  op: z.string(),
  layer: z.string().optional(),
  prop: z.string().optional(),
  value: z.unknown().optional(),
  t: z.number().optional(),
  start: z.number().optional(),
  duration: z.union([z.number(), z.string()]).optional(),
  scene: z.string().optional(),
  id: z.string().optional(),
  index: z.number().optional(),
  parent: z.union([z.string(), z.null()]).optional(),
  type: z.string().optional(),
  text: z.string().optional(),
  x: z.union([z.number(), z.string()]).optional(),
  y: z.union([z.number(), z.string()]).optional(),
  opacity: z.number().optional(),
  at: z.union([z.number(), z.string()]).optional(),
  transition: z.union([z.string(), z.record(z.unknown())]).optional(),
  elements: z.array(z.record(z.unknown())).optional(),
  easing: z.string().optional(),
};
const command = z.object(commandFields).passthrough();
const runArgs = {
  file: z.string().describe("Absolute path to motion.md"),
  ...command.shape,
};
export function createMcpServer() {
  const server = new McpServer({ name: "motioon", version: "0.3.0" });
  const register = (name, description, inputSchema, callback) =>
    server.registerTool(name, { description, inputSchema }, async (args) => {
      try {
        return await callback(args);
      } catch (error) {
        return { ...text(error.message), isError: true };
      }
    });

  register(
    "motion_editor_state",
    "Return the full editor state for a project: comp size/fps/duration, playhead, selection, workarea, scenes (absolute start/duration) and every layer (scene, parent, type, role, absolute start/duration, x/y/opacity/rotation/scale, enabled, locked). State only — never mutates.",
    { file: z.string().describe("Absolute path to motion.md") },
    (a) => text(describe(sessionFor(a.file))),
  );
  register(
    "motion_editor_schema",
    "Document the command bus: every session op (seek/select/play/pause/workarea/undo/redo/describe), every document op (set/keyframe/deleteKeyframe/move/trim/reorder/enable/lock/parent/addLayer/duplicate/remove/addScene/setScene/removeScene) with required args, the editable props and their motion.md mapping, and worked examples.",
    {},
    () => text(opSchema),
  );
  register(
    "motion_editor_run",
    "Run one editor command against a project and return its result plus the resulting editor state. Document ops apply in a single named step and write motion.md when dirty. Never guess an op signature — read motion_editor_schema first. Undo restores the exact prior file snapshot.",
    z.object(runArgs).passthrough(),
    (a) => text(runCommand(sessionFor(a.file), a)),
  );
  register(
    "motion_editor_batch",
    "Run several editor commands in one session in order. Each dirty command writes motion.md; the session state (history, playhead, lock) is shared, so a later undo in the same batch steps back through all of them. Returns per-command results and the final state.",
    {
      file: z.string().describe("Absolute path to motion.md"),
      commands: z
        .array(command)
        .min(1)
        .describe(
          "Commands in order; each is {op, layer?, prop?, value?, t?, start?, duration?, scene?, …}",
        ),
    },
    async (a) => {
      const session = sessionFor(a.file);
      const results = [];
      for (let i = 0; i < a.commands.length; i++) {
        try {
          const r = runCommand(session, a.commands[i]);
          results.push({
            index: i,
            op: r.op,
            ok: r.ok,
            dirty: r.dirty,
            result: r.result,
          });
        } catch (error) {
          throw new Error(
            `Batch aborted at command ${i} (${a.commands[i].op}): ${error.message}`,
          );
        }
      }
      return text({ results, state: describe(session) });
    },
  );

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
    { file: z.string().describe("Absolute path to motion.md") },
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
    "motion_compile",
    "Compile a valid composition into seekable HTML.",
    {
      file: z.string().describe("Absolute path to motion.md"),
      out: z.string().optional(),
    },
    (a) => {
      const result = compileFile(
        a.file,
        a.out || join(dirname(resolve(a.file)), "dist", "composition.html"),
      );
      return text({ out: result.outFile, diagnostics: result.diagnostics });
    },
  );
  register(
    "motion_inspect_frames",
    "Capture up to 24 exact frames as PNG images, with element bounds and overflow diagnostics.",
    {
      file: z.string().describe("Absolute path to motion.md"),
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
    "motion_render",
    "Render an MP4 or WebM video using deterministic frame capture. Range end is exclusive.",
    {
      file: z.string().describe("Absolute path to motion.md"),
      out: z.string().optional(),
      format: z.enum(["mp4", "webm"]).optional(),
      quality: z.enum(["draft", "high"]).optional(),
      workers: z.number().int().min(1).max(8).optional(),
      from: z.number().int().nonnegative().optional(),
      to: z.number().int().positive().optional(),
    },
    async (a) => text(await renderVideo(a.file, a)),
  );
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
