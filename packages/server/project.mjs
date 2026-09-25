import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { build } from "esbuild";
import {
  loadComposition,
  compileToHtml,
  projectPath,
  checkAssets,
} from "../core/index.mjs";
import { assertValid } from "../core/validate.mjs";
import { revisionOf, patchFile, saveSource } from "../core/patch.mjs";
const mime = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".html": "text/html",
};
async function body(req) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 2e6) throw new Error("Request exceeds 2MB.");
  }
  return JSON.parse(data);
}
export async function startProjectServer(
  file,
  { port = 0, studio = false, snapshot, out } = {},
) {
  file = resolve(file);
  const root = dirname(file),
    token = randomUUID(),
    jobs = new Map();
  let url, activeJob;
  const outFile = out
    ? resolve(process.cwd(), out)
    : ["out.mp4", "out.webm"].map((n) => resolve(root, n)).find(existsSync);
  const read = () => {
    const source = readFileSync(file, "utf8"),
      composition = snapshot || loadComposition(file);
    return {
      source,
      composition,
      revision: revisionOf(source),
      diagnostics: assertValid(composition),
    };
  };
  read();
  const soundPanel = studio
    ? (
        await build({
          entryPoints: [
            new URL("../studio/sound-panel.jsx", import.meta.url).pathname,
          ],
          bundle: true,
          write: false,
          format: "iife",
          platform: "browser",
          jsx: "automatic",
          minify: true,
        })
      ).outputFiles[0].contents
    : null;
  const studioShell = studio
    ? (
        await build({
          entryPoints: [
            new URL("../studio/studio-shell.jsx", import.meta.url).pathname,
          ],
          bundle: true,
          write: false,
          format: "iife",
          platform: "browser",
          jsx: "automatic",
          minify: true,
        })
      ).outputFiles[0].contents
    : null;
  const server = createServer(async (req, res) => {
    const send = (status, data, type = "application/json") => {
      res.writeHead(status, {
        "content-type": type,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      res.end(type === "application/json" ? JSON.stringify(data) : data);
    };
    try {
      if (req.headers.host !== new URL(url).host)
        return send(403, { error: "Invalid host." });
      const pathname = decodeURIComponent(new URL(req.url, url).pathname);
      if (req.method === "POST") {
        if (
          !studio ||
          req.headers["x-motion-token"] !== token ||
          (req.headers.origin && req.headers.origin !== url)
        )
          return send(403, { error: "Invalid studio session." });
        const data = await body(req);
        if (pathname === "/api/patch") {
          patchFile(file, data);
          return send(200, read());
        }
        if (pathname === "/api/op") {
          const { sessionFor, runCommand, runCommands, describe } =
            await import("../editor/editor.mjs");
          const session = sessionFor(file);
          const batch =
            Array.isArray(data.commands) && data.commands.length
              ? runCommands(session, data.commands)
              : Array.isArray(data.commands)
                ? { results: [], grouped: false }
                : null;
          let result;
          if (batch) {
            result = {
              op: "batch",
              ok: true,
              dirty: batch.grouped,
              results: batch.results,
              grouped: batch.grouped,
            };
          } else {
            result = runCommand(session, data.command || data);
          }
          if (result.ok === false)
            return send(400, {
              error: result.result?.reason || "Op not applied.",
            });
          return send(200, {
            result,
            state: describe(session),
            undo: session.history.length,
            redo: session.future.length,
            ...read(),
          });
        }
        if (pathname === "/api/source") {
          saveSource(file, data.source, data.revision);
          return send(200, read());
        }
        if (pathname === "/api/render") {
          if (activeJob)
            return send(409, { error: "A render is already running." });
          const id = randomUUID(),
            job = { id, status: "rendering", progress: 0 };
          jobs.set(id, job);
          activeJob = id;
          const { renderVideo } = await import("../renderer/render.mjs");
          renderVideo(file, {
            format: data.format || "mp4",
            quality: data.quality || "high",
            out: resolve(
              root,
              ".motioon",
              `export-${id}.${data.format === "webm" ? "webm" : "mp4"}`,
            ),
            onProgress: (p) => {
              job.progress = p.progress;
              job.frames = p.frames;
            },
          })
            .then((result) =>
              Object.assign(job, { status: "complete", progress: 1, result }),
            )
            .catch((e) =>
              Object.assign(job, { status: "failed", error: e.message }),
            )
            .finally(() => {
              activeJob = null;
            });
          return send(202, job);
        }
        return send(404, { error: "Unknown endpoint." });
      }
      if (req.method !== "GET")
        return send(405, { error: "Method not allowed." });
      if (studio && pathname === "/api/project")
        return send(200, { ...read(), token });
      if (studio && pathname.startsWith("/api/render/")) {
        const job = jobs.get(pathname.split("/").pop());
        return send(job ? 200 : 404, job || { error: "Unknown render." });
      }
      if (studio && pathname.startsWith("/download/")) {
        const [, , jobId, variant] = pathname.split("/");
        const job = jobs.get(jobId);
        if (job?.status !== "complete")
          return send(404, { error: "Export not ready." });
        if (variant && variant !== "silent")
          return send(404, { error: "Unknown export variant." });
        const path =
          variant === "silent" ? job.result.withoutSound : job.result.withSound;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="motioon${variant === "silent" ? "-silent" : "-sound"}${extname(path)}"`,
        );
        return send(200, readFileSync(path), mime[extname(path)]);
      }
      if (pathname === "/out") {
        if (!outFile || !existsSync(outFile) || !statSync(outFile).isFile())
          return send(404, {
            error:
              "No rendered video. Render with `motioon render … -o out.mp4` (or pass --out).",
          });
        return send(200, readFileSync(outFile), mime[extname(outFile)]);
      }
      if (studio && pathname === "/") {
        return send(
          200,
          readFileSync(new URL("../studio/index.html", import.meta.url)),
          "text/html; charset=utf-8",
        );
      }
      if (
        studio &&
        [
          "/studio.js",
          "/studio.css",
          "/preset.css",
          "/sunset-theme.css",
          "/source-tools.js",
        ].includes(pathname)
      )
        return send(
          200,
          readFileSync(
            new URL(`../studio/${pathname.slice(1)}`, import.meta.url),
          ),
          mime[extname(pathname)],
        );
      if (studio && pathname === "/studio-geist.woff2")
        return send(
          200,
          readFileSync(
            new URL("../studio/assets/geist.woff2", import.meta.url),
          ),
          "font/woff2",
        );
      if (studio && pathname === "/studio-inter.woff2")
        return send(
          200,
          readFileSync(
            new URL("../studio/assets/inter.woff2", import.meta.url),
          ),
          "font/woff2",
        );
      if (studio && pathname === "/sound-panel.js")
        return send(200, soundPanel, "text/javascript");
      if (studio && pathname === "/studio-shell.js")
        return send(200, studioShell, "text/javascript");
      // The motion.dev `motion` package (UMD build) drives Studio UI animation.
      if (studio && pathname === "/vendor/motion.js")
        return send(
          200,
          readFileSync(
            new URL(
              "../../node_modules/motion/dist/motion.js",
              import.meta.url,
            ),
          ),
          "text/javascript",
        );
      if (pathname === "/" || pathname === "/composition.html") {
        const { composition } = read();
        return send(
          200,
          compileToHtml(composition, {
            preview: studio && pathname === "/composition.html",
          }),
          "text/html; charset=utf-8",
        );
      }
      const path = projectPath(root, "." + pathname);
      if (!statSync(path).isFile()) return send(404, { error: "Not a file." });
      const range = req.headers.range;
      const size = statSync(path).size;
      if (range && /^bytes=\d*-\d*$/.test(range)) {
        const [, startText, endText] = /^bytes=(\d*)-(\d*)$/.exec(range);
        const start = startText
          ? Number(startText)
          : Math.max(0, size - Number(endText));
        const end =
          endText && startText ? Math.min(size - 1, Number(endText)) : size - 1;
        if (start >= size || start > end) {
          res.writeHead(416, { "content-range": `bytes */${size}` });
          return res.end();
        }
        res.writeHead(206, {
          "content-type": mime[extname(path)] || "application/octet-stream",
          "content-range": `bytes ${start}-${end}/${size}`,
          "content-length": end - start + 1,
          "accept-ranges": "bytes",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        return createReadStream(path, { start, end }).pipe(res);
      }
      // HTML runs inside a sandboxed iframe in Studio; arbitrary project files are served only on loopback.
      return send(
        200,
        readFileSync(path),
        mime[extname(path)] || "application/octet-stream",
      );
    } catch (e) {
      send(e.status || 400, { error: e.message });
    }
  });
  await new Promise((yes, no) => {
    server.once("error", no);
    server.listen(port, "127.0.0.1", yes);
  });
  url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    server,
    close: () =>
      new Promise((r) => {
        server.close(r);
        server.closeAllConnections();
      }),
  };
}
