import { z } from "zod";

/**
 * A time value in motion.md source is always a string like "2s" or "1.5s".
 * Internally, everything is normalized to seconds (number).
 */
export const TimeStringSchema = z
  .string()
  .regex(/^\d+(\.\d+)?s$/, "time must look like '2s' or '1.5s'");

export const AspectRatioSchema = z
  .string()
  .regex(
    /^(\d+):(\d+)$|^\d+x\d+$/,
    "aspect_ratio must be 'W:H' (e.g. '16:9') or explicit pixel size 'WxH' (e.g. '1920x1080')"
  );

export const AssetSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  /** Inferred from file extension if omitted. */
  type: z.enum(["image", "video", "audio", "font", "other"]).optional(),
});
export type Asset = z.infer<typeof AssetSchema>;

/** Raw frontmatter as it appears in the motion.md YAML header, before normalization. */
export const FrontmatterSchema = z.object({
  title: z.string().optional(),
  aspect_ratio: AspectRatioSchema,
  duration: TimeStringSchema,
  fps: z.number().int().positive().default(30),
  background: z.string().default("#000000"),
  assets: z.array(AssetSchema).default([]),
});
export type Frontmatter = z.infer<typeof FrontmatterSchema>;

/** A single ## Scene: block parsed out of the markdown body. */
export interface RawScene {
  name: string;
  /** Raw time strings exactly as written in the heading, e.g. "0s", "2s". */
  startRaw: string;
  endRaw: string;
  /** The HTML fragment between this heading and the next one (or EOF). */
  html: string;
  /** 1-based line number of the heading, for error messages. */
  line: number;
}

/** A scene after time strings have been resolved to seconds and validated. */
export interface Scene {
  name: string;
  start: number;
  end: number;
  html: string;
  /** Asset ids referenced via asset://<id> inside this scene's HTML. */
  referencedAssets: string[];
}

export interface Resolution {
  width: number;
  height: number;
}

/** Fully parsed and validated motion.md document, ready for a renderer to consume. */
export interface MotionDoc {
  title?: string;
  aspectRatio: string;
  resolution: Resolution;
  duration: number;
  fps: number;
  background: string;
  assets: Asset[];
  scenes: Scene[];
}

export class MotionParseError extends Error {
  constructor(message: string, public readonly line?: number) {
    super(line ? `${message} (line ${line})` : message);
    this.name = "MotionParseError";
  }
}
