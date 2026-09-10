import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { parseDocument } from "yaml";
import { parseMotionMarkdown, sourceParts } from "./parse.mjs";
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
  "at",
  "duration",
  "enter",
  "exit",
  "hidden",
  "radius",
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
]);
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
      if (
        !["title", "duration", "fps", "width", "height", "background"].includes(
          k,
        )
      )
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
