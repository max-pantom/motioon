import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
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
  { port = 0, studio = false, snapshot } = {},
) {
  file = resolve(file);
  const root = dirname(file),
    token = randomUUID(),
    jobs = new Map();
  let url, activeJob;
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
        const job = jobs.get(pathname.split("/").pop());
        if (job?.status !== "complete")
          return send(404, { error: "Export not ready." });
        const path = job.result.out;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="motioon${extname(path)}"`,
        );
        return send(200, readFileSync(path), mime[extname(path)]);
      }
      if (studio && pathname === "/") {
        return send(
          200,
          readFileSync(new URL("../studio/index.html", import.meta.url)),
          "text/html; charset=utf-8",
        );
      }
      if (studio && ["/studio.js", "/studio.css"].includes(pathname))
        return send(
          200,
          readFileSync(
            new URL(`../studio/${pathname.slice(1)}`, import.meta.url),
          ),
          mime[extname(pathname)],
        );
      if (pathname === "/" || pathname === "/composition.html") {
        const { composition } = read();
        return send(
          200,
          compileToHtml(composition),
          "text/html; charset=utf-8",
        );
      }
      const path = projectPath(root, "." + pathname);
      if (!statSync(path).isFile()) return send(404, { error: "Not a file." });
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
