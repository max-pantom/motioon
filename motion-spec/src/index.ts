import { parseMotionSource } from "./parser.js";
import { buildMotionDoc } from "./validate.js";
import type { BuildResult } from "./validate.js";

export * from "./types.js";
export { resolveAspectRatio, parseTime } from "./time.js";

/**
 * Parses and fully validates a motion.md source string.
 * Throws MotionParseError on structural problems (bad frontmatter, bad
 * time ranges, unknown asset refs). Returns non-fatal issues (overlapping
 * scenes, unused assets, trailing gaps) as `warnings`.
 */
export function parseMotion(source: string): BuildResult {
  const raw = parseMotionSource(source);
  return buildMotionDoc(raw);
}
