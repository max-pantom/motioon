import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  existsSync,
  realpathSync,
  readdirSync,
} from "node:fs";
import { dirname, resolve, join, relative, isAbsolute } from "node:path";
import { parseMotionMarkdown } from "./parse.mjs";
import {
  assertValid,
  validateComposition,
  describeComposition,
} from "./validate.mjs";
import { compileToHtml, resolveSrc } from "./compile.mjs";
export {
  parseMotionMarkdown,
  validateComposition,
  describeComposition,
  compileToHtml,
};
export function loadComposition(file) {
  const comp = parseMotionMarkdown(readFileSync(file, "utf8"));
  comp.sourcePath = resolve(file);
  if (comp.catalogPath) {
    const path = projectPath(dirname(comp.sourcePath), comp.catalogPath);
    const catalog = JSON.parse(readFileSync(path, "utf8"));
    if (!catalog || Array.isArray(catalog) || typeof catalog !== "object")
      throw new Error("Asset catalog must be a JSON object.");
    comp.catalog = catalog;
    for (const [id, entry] of Object.entries(catalog)) {
      if (!/^[\w.-]+$/.test(id) || !entry || typeof entry.src !== "string")
        throw new Error(`Invalid catalog entry '${id}'.`);
      const src = entry.src.replace(/^\.\//, "");
      if (Object.hasOwn(comp.assets, id) && comp.assets[id] !== src)
        throw new Error(`Catalog asset '${id}' conflicts with frontmatter.`);
      comp.assets[id] = src;
      if (!comp.assetInfo.some((a) => a.id === id))
        comp.assetInfo.push({ id, src, type: entry.kind });
    }
  }
  return comp;
}
export function projectPath(root, src) {
  if (
    typeof src !== "string" ||
    !src ||
    isAbsolute(src) ||
    /^[a-z][\w+.-]*:/i.test(src) ||
    src.startsWith("//")
  )
    throw new Error(`Use a project-local asset: ${src}`);
  const base = realpathSync(root),
    target = resolve(base, src),
    rel = relative(base, target);
  if (
    rel === ".." ||
    rel.startsWith(".." + (process.platform === "win32" ? "\\" : "/")) ||
    isAbsolute(rel)
  )
    throw new Error(`Asset escapes project: ${src}`);
  if (!existsSync(target)) throw new Error(`Missing asset: ${src}`);
  const real = realpathSync(target),
    realRel = relative(base, real);
  if (
    realRel === ".." ||
    realRel.startsWith(".." + (process.platform === "win32" ? "\\" : "/")) ||
    isAbsolute(realRel)
  )
    throw new Error(`Asset symlink escapes project: ${src}`);
  return target;
}
export function checkAssets(comp) {
  const root = dirname(comp.sourcePath);
  for (const src of [
    ...Object.values(comp.assets),
    ...comp.audio.map((a) => resolveSrc(a.src, comp.assets)),
    ...comp.scenes.flatMap((s) =>
      s.elements
        .filter((e) => ["image", "video"].includes(e.type))
        .map((e) => resolveSrc(e.src, comp.assets)),
    ),
  ])
    projectPath(root, src);
}
export function compileFile(file, outFile, { preview = false } = {}) {
  const composition = loadComposition(file),
    diagnostics = assertValid(composition);
  checkAssets(composition);
  mkdirSync(dirname(outFile), { recursive: true });
  // Preserve relative references, including raw HTML stylesheets and nested font/image assets.
  const root = dirname(resolve(file)),
    dest = dirname(resolve(outFile));
  if (dest !== root) {
    const walk = (dir) => {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        const from = join(dir, ent.name);
        if (
          from === dest ||
          [".motioon", "dist", "node_modules", ".git", "test-results"].includes(
            ent.name,
          ) ||
          /\.(mp4|webm)(\.json)?$/.test(ent.name)
        )
          continue;
        const to = join(dest, relative(root, from));
        if (ent.isDirectory()) walk(from);
        else if (ent.isFile() || ent.isSymbolicLink()) {
          projectPath(root, relative(root, from));
          mkdirSync(dirname(to), { recursive: true });
          cpSync(from, to, { dereference: true });
        }
      }
    };
    // An ancestor output would overwrite source files when copying relative paths.
    if (relative(dest, root) && !relative(dest, root).startsWith(".."))
      throw new Error("Compile output cannot be a parent of the project.");
    walk(root);
  }
  writeFileSync(outFile, compileToHtml(composition, { preview }));
  return { composition, diagnostics, outFile };
}
