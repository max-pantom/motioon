import type { RawMotionDoc } from "./parser.js";
import type { MotionDoc, Scene } from "./types.js";
import { MotionParseError } from "./types.js";
import { parseTime, resolveAspectRatio } from "./time.js";

const ASSET_REF = /asset:\/\/([a-zA-Z0-9_-]+)/g;

export interface BuildResult {
  doc: MotionDoc;
  warnings: string[];
}

export function buildMotionDoc(raw: RawMotionDoc): BuildResult {
  const warnings: string[] = [];
  const { frontmatter, scenes: rawScenes } = raw;

  const duration = parseTime(frontmatter.duration, "frontmatter.duration");
  const resolution = resolveAspectRatio(frontmatter.aspect_ratio);
  const assetIds = new Set(frontmatter.assets.map((a) => a.id));

  const seenIds = new Set<string>();
  for (const a of frontmatter.assets) {
    if (seenIds.has(a.id)) {
      throw new MotionParseError(`duplicate asset id '${a.id}'`);
    }
    seenIds.add(a.id);
  }

  const seenNames = new Set<string>();
  const scenes: Scene[] = rawScenes.map((raw) => {
    if (seenNames.has(raw.name)) {
      throw new MotionParseError(
        `duplicate scene name '${raw.name}'`,
        raw.line
      );
    }
    seenNames.add(raw.name);

    const start = parseTime(raw.startRaw, `scene '${raw.name}'`);
    const end = parseTime(raw.endRaw, `scene '${raw.name}'`);

    if (end <= start) {
      throw new MotionParseError(
        `scene '${raw.name}' has end (${end}s) <= start (${start}s)`,
        raw.line
      );
    }
    if (start < 0) {
      throw new MotionParseError(
        `scene '${raw.name}' has negative start time`,
        raw.line
      );
    }
    if (end > duration) {
      throw new MotionParseError(
        `scene '${raw.name}' ends at ${end}s, after the document duration (${duration}s)`,
        raw.line
      );
    }
    if (raw.html.length === 0) {
      warnings.push(`scene '${raw.name}' has no HTML content`);
    }

    const referencedAssets = new Set<string>();
    for (const m of raw.html.matchAll(ASSET_REF)) {
      const id = m[1];
      if (!assetIds.has(id)) {
        throw new MotionParseError(
          `scene '${raw.name}' references unknown asset 'asset://${id}' — not declared in frontmatter.assets`,
          raw.line
        );
      }
      referencedAssets.add(id);
    }

    return {
      name: raw.name,
      start,
      end,
      html: raw.html,
      referencedAssets: [...referencedAssets],
    };
  });

  scenes.sort((a, b) => a.start - b.start);

  for (let i = 1; i < scenes.length; i++) {
    const prev = scenes[i - 1];
    const cur = scenes[i];
    if (cur.start < prev.end) {
      warnings.push(
        `scenes '${prev.name}' and '${cur.name}' overlap (${prev.name} ends ${prev.end}s, ${cur.name} starts ${cur.start}s)`
      );
    } else if (cur.start > prev.end) {
      warnings.push(
        `gap between '${prev.name}' (ends ${prev.end}s) and '${cur.name}' (starts ${cur.start}s) — nothing renders in that window`
      );
    }
  }
  if (scenes.length > 0 && scenes[scenes.length - 1].end < duration) {
    warnings.push(
      `last scene ends at ${scenes[scenes.length - 1].end}s but duration is ${duration}s — trailing gap`
    );
  }

  const usedAssetIds = new Set(scenes.flatMap((s) => s.referencedAssets));
  for (const asset of frontmatter.assets) {
    if (!usedAssetIds.has(asset.id)) {
      warnings.push(`asset '${asset.id}' is declared but never referenced`);
    }
  }

  const doc: MotionDoc = {
    title: frontmatter.title,
    aspectRatio: frontmatter.aspect_ratio,
    resolution,
    duration,
    fps: frontmatter.fps,
    background: frontmatter.background,
    assets: frontmatter.assets,
    scenes,
  };

  return { doc, warnings };
}
