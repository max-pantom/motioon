import matter from "gray-matter";
import { FrontmatterSchema, MotionParseError } from "./types.js";
import type { RawScene } from "./types.js";

// Matches: ## Scene: intro (0s-2s)   / (0s–2s) with an en dash / extra spacing
const SCENE_HEADING = /^##\s+Scene:\s*(.+?)\s*\(\s*(\S+?)\s*[-–]\s*(\S+?)\s*\)\s*$/;

export interface RawMotionDoc {
  frontmatter: ReturnType<typeof FrontmatterSchema.parse>;
  scenes: RawScene[];
}

/**
 * Splits a motion.md source string into validated frontmatter and a list of
 * raw scenes. Does not resolve time strings to seconds or cross-check
 * assets — see validate.ts for that pass.
 */
export function parseMotionSource(source: string): RawMotionDoc {
  const { data, content } = matter(source);

  const fmResult = FrontmatterSchema.safeParse(data);
  if (!fmResult.success) {
    const issue = fmResult.error.issues[0];
    throw new MotionParseError(
      `frontmatter error at '${issue.path.join(".")}': ${issue.message}`
    );
  }

  const lines = content.split(/\r?\n/);
  const scenes: RawScene[] = [];
  let current: (RawScene & { bodyLines: string[] }) | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = SCENE_HEADING.exec(line);

    if (headingMatch) {
      if (current) {
        scenes.push(finalizeScene(current));
      }
      current = {
        name: headingMatch[1],
        startRaw: headingMatch[2],
        endRaw: headingMatch[3],
        html: "",
        line: i + 1,
        bodyLines: [],
      };
      continue;
    }

    // Any other heading level ends the current scene's body.
    if (/^#{1,6}\s/.test(line) && current) {
      scenes.push(finalizeScene(current));
      current = null;
      continue;
    }

    if (current) {
      current.bodyLines.push(line);
    }
  }

  if (current) {
    scenes.push(finalizeScene(current));
  }

  if (scenes.length === 0) {
    throw new MotionParseError(
      "no scenes found — expected at least one '## Scene: name (0s-2s)' heading"
    );
  }

  return { frontmatter: fmResult.data, scenes };
}

function finalizeScene(
  scene: RawScene & { bodyLines: string[] }
): RawScene {
  const { bodyLines, ...rest } = scene;
  return { ...rest, html: bodyLines.join("\n").trim() };
}
