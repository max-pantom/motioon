import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resolveSrc(src, assets) {
  if (!src) return "";
  if (src.startsWith("asset:")) return assets[src.slice(6)] || "";
  return src;
}

function styleFor(el) {
  const x = el.x ?? "50%";
  const y = el.y ?? "50%";
  const parts = [
    `left:${typeof x === "number" ? x + "px" : x}`,
    `top:${typeof y === "number" ? y + "px" : y}`,
    "transform:translate(-50%,-50%)",
    el.w != null ? `width:${typeof el.w === "number" ? el.w + "px" : el.w}` : "",
    el.h != null ? `height:${typeof el.h === "number" ? el.h + "px" : el.h}` : "",
    el.opacity != null ? `opacity:${el.opacity}` : "",
    `z-index:${el.z ?? 1}`,
    el.color ? `color:${el.color}` : "",
    el.max_width ? `max-width:${el.max_width}` : "",
    el.radius != null ? `border-radius:${typeof el.radius === "number" ? el.radius + "px" : el.radius}` : "",
  ];
  return parts.filter(Boolean).join(";");
}

function renderElement(el, assets) {
  const motion = JSON.stringify({
    at: el.at,
    duration: el.duration,
    enter: el.enter,
    exit: el.exit,
  });
  const common = `class="el el-${el.type} role-${el.role || "none"}" data-id="${esc(el.id)}" data-motion='${esc(motion)}' style="${styleFor(el)}"`;
  if (el.type === "image") {
    const src = resolveSrc(el.src, assets);
    return `<img ${common} src="${esc(src)}" alt="${esc(el.id)}" data-fit="${esc(el.fit || "contain")}" />`;
  }
  if (el.type === "shape") {
    const fill = el.fill || "transparent";
    return `<div ${common} data-shape="${esc(el.shape || "rect")}" style="${styleFor(el)};background:${fill}"></div>`;
  }
  if (el.type === "html") {
    return `<div ${common}>${el.html || ""}</div>`;
  }
  const text = esc(el.text || "");
  return `<div ${common}>${text}</div>`;
}

export function compileToHtml(comp, { preview = true } = {}) {
  const runtime = readFileSync(join(here, "../runtime/runtime.js"), "utf8");
  const studio = preview ? readFileSync(join(here, "../studio/player.js"), "utf8") : "";
  const studioCss = preview ? readFileSync(join(here, "../studio/player.css"), "utf8") : "";

  const scenes = comp.scenes
    .map((scene) => {
      const kids = scene.elements.map((el) => renderElement(el, comp.assets)).join("\n");
      return `<section class="scene" data-id="${esc(scene.id)}" data-start="${scene.start}" data-duration="${scene.duration}" data-transition="${esc(scene.transition.type)}" data-transition-duration="${scene.transition.duration}">${kids}</section>`;
    })
    .join("\n");

  const payload = {
    version: 1,
    id: comp.id,
    title: comp.title,
    width: comp.width,
    height: comp.height,
    fps: comp.fps,
    duration: comp.duration,
    background: comp.background,
    theme: comp.theme,
    scenes: comp.scenes.map((s) => ({
      id: s.id,
      start: s.start,
      duration: s.duration,
      transition: s.transition,
    })),
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(comp.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: ${comp.background};
      --accent: ${comp.theme.accent};
      --text: ${comp.theme.text};
      --muted: ${comp.theme.muted};
      --safe: ${comp.safe_area}px;
      --font-display: ${comp.theme.font_display};
      --font-body: ${comp.theme.font_body};
      --comp-w: ${comp.width}px;
      --comp-h: ${comp.height}px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; background: #0a0a0c; color: var(--text); font-family: var(--font-body); }
    #stage-wrap { display: grid; place-items: center; height: ${preview ? "calc(100% - 72px)" : "100%"}; background: #050507; }
    #stage {
      position: relative;
      width: var(--comp-w);
      height: var(--comp-h);
      background: var(--bg);
      overflow: hidden;
      transform-origin: center center;
    }
    .scene { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
    .scene.active { opacity: 1; }
    .el { position: absolute; margin: 0; }
    .el-text, .el-caption {
      font-family: var(--font-display);
      color: var(--text);
      text-align: center;
      white-space: pre-wrap;
      padding: 0 8px;
    }
    .role-hero { font-size: 72px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; max-width: 86%; }
    .role-sub { font-size: 28px; font-weight: 500; color: var(--muted); max-width: 70%; line-height: 1.35; }
    .role-caption { font-size: 22px; font-weight: 600; }
    .role-label { font-size: 16px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); }
    .el-image { object-fit: contain; max-width: 88%; max-height: 88%; }
    .el-image[data-fit="cover"] { object-fit: cover; }
    .el-shape[data-shape="circle"] { border-radius: 999px; }
    .el-shape[data-shape="pill"] { border-radius: 999px; }
    ${studioCss}
  </style>
</head>
<body data-preview="${preview ? "1" : "0"}">
  <div id="stage-wrap"><div id="stage">${scenes}</div></div>
  ${preview ? `<div id="studio-root"></div>` : ""}
  <script>window.__MOTION_COMP__ = ${JSON.stringify(payload)};</script>
  <script>${runtime}</script>
  ${preview ? `<script>${studio}</script>` : ""}
</body>
</html>`;
}
