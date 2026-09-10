import type { Resolution } from "./types.js";
import { MotionParseError } from "./types.js";

/** "2s" | "1.5s" -> 2 | 1.5 */
export function parseTime(raw: string, context?: string): number {
  const match = /^(\d+(?:\.\d+)?)s$/.exec(raw.trim());
  if (!match) {
    throw new MotionParseError(
      `invalid time value '${raw}'${context ? ` in ${context}` : ""} — expected e.g. '2s' or '1.5s'`
    );
  }
  return Number(match[1]);
}

const ASPECT_PRESETS: Record<string, Resolution> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "21:9": { width: 2560, height: 1080 },
};

/**
 * Resolves an aspect_ratio field to a concrete pixel resolution.
 * Accepts known presets ("16:9"), arbitrary ratios ("3:2" -> scaled to a
 * 1080-wide default), or explicit pixel sizes ("1920x1080").
 */
export function resolveAspectRatio(raw: string): Resolution {
  const pixelMatch = /^(\d+)x(\d+)$/.exec(raw);
  if (pixelMatch) {
    return { width: Number(pixelMatch[1]), height: Number(pixelMatch[2]) };
  }

  if (ASPECT_PRESETS[raw]) {
    return ASPECT_PRESETS[raw];
  }

  const ratioMatch = /^(\d+):(\d+)$/.exec(raw);
  if (ratioMatch) {
    const w = Number(ratioMatch[1]);
    const h = Number(ratioMatch[2]);
    // Fall back to a 1080-long-edge default for non-preset ratios.
    const longEdge = 1080;
    if (w >= h) {
      return { width: longEdge, height: Math.round((longEdge * h) / w) };
    }
    return { width: Math.round((longEdge * w) / h), height: longEdge };
  }

  throw new MotionParseError(`unrecognized aspect_ratio '${raw}'`);
}
