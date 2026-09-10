import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseMotionMarkdown } from "./parse.mjs";
import { validateComposition, describeComposition } from "./validate.mjs";
import { compileToHtml } from "./compile.mjs";

export { parseMotionMarkdown, validateComposition, describeComposition, compileToHtml };

export function loadComposition(file) {
  const md = readFileSync(file, "utf8");
  const composition = parseMotionMarkdown(md);
  composition.sourcePath = resolve(file);
  return composition;
}

export function compileFile(file, outFile, { preview = true } = {}) {
  const composition = loadComposition(file);
  const diagnostics = validateComposition(composition);
  const html = compileToHtml(composition, { preview });
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  return { composition, diagnostics, outFile };
}
