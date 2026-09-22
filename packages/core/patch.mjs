import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { parseDocument, stringify, YAMLSeq } from "yaml";
import { parseMotionMarkdown, parseTime, sourceParts } from "./parse.mjs";
import { assertValid } from "./validate.mjs";
export const revisionOf = (source) =>
  createHash("sha256").update(source).digest("hex");
const elementKeys = new Set([
  "text",
  "x",
  "y",
  "w",
  "h",
  "font_size",
  "font_weight",
  "color",
  "fill",
  "opacity",
  "scale",
  "rotation",
  "blur",
  "at",
  "duration",
  "enter",
  "exit",
  "animate",
  "count",
  "replace",
  "hidden",
  "radius",
  "z",
  "src",
  "fit",
  "max_width",
  "split",
  "stagger",
  "letter_spacing",
  "line_height",
  "text_transform",
  "text_stroke",
  "shadow",
  "blend_mode",
  "shape",
  "html",
  "svg",
  "children",
]);
const projectKeys = [
  "title",
  "duration",
  "fps",
  "width",
  "height",
  "background",
  "safe_area",
  "theme",
  "assets",
  "audio",
];
export function patchSource(source, { scene, element, set, revision }) {
  if (revision && revision !== revisionOf(source)) {
    const e = new Error(
      "The source changed. Reload before saving to avoid overwriting another edit.",
    );
    e.status = 409;
    throw e;
  }
  if (
    !set ||
    Array.isArray(set) ||
    typeof set !== "object" ||
    !Object.keys(set).length
  )
    throw new Error("Provide fields to update.");
  const parts = sourceParts(source);
  let result;
  if (!scene) {
    const doc = parseDocument(parts.front[1]);
    for (const [k, v] of Object.entries(set)) {
      if (!projectKeys.includes(k))
        throw new Error(`Cannot update project field '${k}'.`);
      doc.set(k, v);
    }
    result =
      "---\n" + doc.toString() + "---\n" + source.slice(parts.front[0].length);
  } else {
    const block = parts.scenes.find((s) => s.id === scene);
    if (!block) throw new Error(`Scene '${scene}' not found.`);
    if (block.startRaw != null)
      throw new Error(
        "Edit raw HTML scenes in the source editor. Property controls apply to structured scenes.",
      );
    const fence = block.body.match(/```motion\s*\r?\n([\s\S]*?)```/);
    const doc = parseDocument(fence[1]);
    if (element) {
      const list = doc.get("elements");
      const i =
        list?.items.findIndex(
          (e, j) => (e.get("id") || `${scene}-${j}`) === element,
        ) ?? -1;
      if (i < 0) throw new Error(`Element '${element}' not found.`);
      for (const [k, v] of Object.entries(set)) {
        if (!elementKeys.has(k))
          throw new Error(`Cannot update element field '${k}'.`);
        doc.setIn(["elements", i, k], v);
      }
    } else {
      for (const [k, v] of Object.entries(set)) {
        if (!["at", "duration", "transition"].includes(k))
          throw new Error(`Cannot update scene field '${k}'.`);
        doc.set(k, v);
      }
    }
    const local = block.body.replace(
      fence[0],
      "```motion\n" + doc.toString() + "```",
    );
    result =
      source.slice(0, block.bodyOffset) + local + source.slice(block.endOffset);
  }
  assertValid(parseMotionMarkdown(result));
  return result;
}
export function saveSource(file, source, revision) {
  const previous = readFileSync(file, "utf8");
  if (revision && revision !== revisionOf(previous)) {
    const e = new Error("Source changed externally. Reload before saving.");
    e.status = 409;
    throw e;
  }
  assertValid(parseMotionMarkdown(source));
  const temp = `${file}.${randomUUID()}.tmp`;
  writeFileSync(temp, source);
  renameSync(temp, file);
  return revisionOf(source);
}
export function patchFile(file, patch) {
  const source = readFileSync(file, "utf8"),
    updated = patchSource(source, patch);
  return {
    revision: saveSource(file, updated, revisionOf(source)),
    composition: parseMotionMarkdown(updated),
  };
}
function insertAsset(doc, asset) {
  if (!asset || !/^[\w-]+$/.test(asset.id) || typeof asset.src !== "string")
    throw new Error("Asset needs an id (letters, digits, - or _) and a src.");
  const entry = asset.type ? { src: asset.src, type: asset.type } : asset.src;
  const existing = doc.get("assets");
  if (existing instanceof YAMLSeq) doc.addIn(["assets"], { ...asset });
  else doc.setIn(["assets", asset.id], entry);
}
export function insertSource(source, insert = {}) {
  const { scene, element, animation, asset } = insert;
  const targets =
    [element && typeof element === "object", animation, asset].filter(Boolean)
      .length + (scene && typeof scene === "object" ? 1 : 0);
  if (targets !== 1)
    throw new Error(
      "Provide exactly one of scene (object), element (object), animation or asset.",
    );
  const parts = sourceParts(source);
  let result;
  if (asset) {
    const doc = parseDocument(parts.front[1]);
    insertAsset(doc, asset);
    result =
      "---\n" + doc.toString() + "---\n" + source.slice(parts.front[0].length);
  } else if (scene && typeof scene === "object") {
    if (!scene.id || !/^[\w-]+$/.test(scene.id))
      throw new Error("Scene needs an id of letters, digits, - or _.");
    const comp = parseMotionMarkdown(source);
    if (comp.scenes.some((s) => s.id === scene.id))
      throw new Error(`Scene '${scene.id}' already exists.`);
    const fps = comp.fps;
    const cursor = comp.scenes.reduce(
      (end, s) => Math.max(end, s.start + s.duration),
      0,
    );
    const start = parseTime(scene.at ?? cursor, fps);
    const duration = parseTime(scene.duration ?? 2, fps);
    if (start + duration > comp.duration + 1e-6) {
      const doc = parseDocument(parts.front[1]);
      doc.set("duration", start + duration);
      source =
        "---\n" +
        doc.toString() +
        "---\n" +
        source.slice(parts.front[0].length);
      parts.front = sourceParts(source).front;
    }
    const body = { ...scene, at: start, duration };
    delete body.id;
    result =
      source.replace(/\s*$/, "") +
      `\n\n## scene: ${scene.id}\n\`\`\`motion\n${stringify(body)}\`\`\`\n`;
  } else {
    if (!insert.scene) throw new Error("Provide the scene to edit.");
    const block = parts.scenes.find((s) => s.id === insert.scene);
    if (!block) throw new Error(`Scene '${insert.scene}' not found.`);
    if (block.startRaw != null)
      throw new Error(
        "HTML scenes are edited as source. Property insertion applies to structured scenes.",
      );
    const fence = block.body.match(/```motion\s*\r?\n([\s\S]*?)```/);
    const doc = parseDocument(fence[1]);
    if (animation) {
      if (typeof animation !== "object" || !Object.keys(animation).length)
        throw new Error("Animation needs at least one property track.");
      const list = doc.get("elements");
      const i =
        list?.items.findIndex(
          (e, j) => (e.get("id") || `${insert.scene}-${j}`) === insert.element,
        ) ?? -1;
      if (i < 0) throw new Error(`Element '${insert.element}' not found.`);
      for (const [prop, spec] of Object.entries(animation))
        doc.setIn(["elements", i, "animate", prop], spec);
    } else {
      if (!element || typeof element !== "object")
        throw new Error("Element must be a mapping.");
      const list = doc.get("elements");
      if (list instanceof YAMLSeq) doc.addIn(["elements"], element);
      else doc.set("elements", [element]);
    }
    const local = block.body.replace(
      fence[0],
      "```motion\n" + doc.toString() + "```",
    );
    result =
      source.slice(0, block.bodyOffset) + local + source.slice(block.endOffset);
  }
  assertValid(parseMotionMarkdown(result));
  return result;
}
export function insertFile(file, insert) {
  const source = readFileSync(file, "utf8"),
    updated = insertSource(source, insert);
  return {
    revision: saveSource(file, updated, revisionOf(source)),
    composition: parseMotionMarkdown(updated),
  };
}
