import { readFileSync } from "node:fs";
export const escapeHtml = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const json = (v) => JSON.stringify(v).replaceAll("<", "\\u003c");
const unit = (v) => (typeof v === "number" ? `${v}px` : v);
export function resolveSrc(src, assets) {
  return src?.replace(/^asset:(?:\/\/)?([\w-]+)$/, (_, id) => assets[id] ?? "");
}
function replaceAssets(html, assets) {
  return html.replace(/asset:(?:\/\/)?([\w-]+)/g, (_, id) =>
    escapeHtml(assets[id] || ""),
  );
}
function renderElement(el, assets) {
  const css = {
    left: unit(el.x ?? "50%"),
    top: unit(el.y ?? "50%"),
    width: unit(el.w),
    height: unit(el.h),
    color: el.color,
    "font-size": unit(el.font_size),
    "font-weight": el.font_weight,
    "max-width": unit(el.max_width),
    "border-radius": unit(el.radius),
    "z-index": el.z,
    background: el.fill,
    "box-shadow": el.shadow,
    "mix-blend-mode": el.blend_mode,
    "letter-spacing": unit(el.letter_spacing),
    "line-height": el.line_height,
    "text-transform": el.text_transform,
    "-webkit-text-stroke": el.text_stroke,
  };
  const style = Object.entries(css)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  const common = `class="el el-${escapeHtml(el.type)} role-${escapeHtml(el.role || "none")}" data-id="${escapeHtml(el.id)}" data-motion-id="${escapeHtml(el.id)}" data-spec="${escapeHtml(JSON.stringify(el))}" style="${escapeHtml(style)}"`;
  if (el.type === "image")
    return `<img ${common} src="${escapeHtml(resolveSrc(el.src, assets))}" alt="${escapeHtml(el.alt || el.id)}" data-fit="${escapeHtml(el.fit || "contain")}">`;
  let content = escapeHtml(el.text || "");
  if (
    ["words", "chars", "lines"].includes(el.split) &&
    ["text", "caption"].includes(el.type)
  ) {
    const tokens =
      el.split === "words"
        ? String(el.text || "").split(/(\s+)/)
        : el.split === "lines"
          ? String(el.text || "").split(/(\n)/)
          : [...String(el.text || "")];
    let index = 0;
    content = tokens
      .map((token) => {
        if (/^\s+$/.test(token))
          return token.includes("\n") ? "<br>" : escapeHtml(token);
        return `<span class="motion-token" data-token="${index++}">${escapeHtml(token)}</span>`;
      })
      .join("");
  }
  return `<div ${common} data-shape="${escapeHtml(el.shape || "")}">${el.type === "html" ? replaceAssets(el.html || "", assets) : el.type === "shape" ? "" : content}</div>`;
}
export function compileToHtml(comp, { preview = false } = {}) {
  const runtime = readFileSync(
    new URL("../runtime/runtime.js", import.meta.url),
    "utf8",
  );
  const scenes = comp.scenes
    .map(
      (s) =>
        `<section class="scene" data-id="${escapeHtml(s.id)}" data-start="${s.start}" data-duration="${s.duration}" data-transition="${s.transition.type}" data-transition-duration="${s.transition.duration}">${s.format === "html" ? replaceAssets(s.html, comp.assets) : s.elements.map((e) => renderElement(e, comp.assets)).join("\n")}</section>`,
    )
    .join("\n");
  const fonts = comp.assetInfo
    .filter((a) => a.type === "font")
    .map(
      (a) =>
        `@font-face{font-family:${JSON.stringify(a.id)};src:url(${JSON.stringify(a.src)});font-display:block;}`,
    )
    .join("\n");
  // Bootstrap the API before scene scripts execute, then mount after the DOM exists.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(comp.title)}</title><style>
  ${fonts}
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${comp.background};color:${comp.theme.text};font-family:${comp.theme.font_body}}
  #stage{position:relative;width:${comp.width}px;height:${comp.height}px;overflow:hidden;background:${comp.background};transform-origin:top left}
  .scene{position:absolute;inset:0;visibility:hidden;opacity:0;pointer-events:none}.scene.active{visibility:visible;opacity:1;pointer-events:auto}
  .el{position:absolute;margin:0;transform:translate(-50%,-50%)}.el-text,.el-caption{font-size:22px;font-family:${comp.theme.font_display};text-align:center;white-space:pre-wrap;padding:0 8px}.motion-token{display:inline-block;white-space:pre;will-change:transform,opacity,filter}
  .role-hero{font-size:72px;font-weight:800;line-height:1.05;max-width:86%}.role-sub{font-size:28px;font-weight:500;color:${comp.theme.muted};max-width:70%;line-height:1.35}.role-caption{font-size:22px;font-weight:600}.role-label{font-size:16px;font-weight:600;color:${comp.theme.accent}}
  .el-image{object-fit:contain;max-width:100%;max-height:100%}.el-image[data-fit=cover]{object-fit:cover}.el-shape[data-shape=circle],.el-shape[data-shape=pill]{border-radius:999px}
  </style><script>window.__MOTION_COMP__=${json(comp)};</script><script>${runtime}</script></head><body data-preview="${preview ? 1 : 0}"><div id="stage">${scenes}</div><script>motion.mount();</script></body></html>`;
}
