import { parseDocument } from "yaml";
import { resolveRecipe } from "./recipes.mjs";

export function parseYaml(text) {
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length)
    throw new Error(`Invalid YAML: ${doc.errors[0].message}`);
  const value = doc.toJS({ maxAliasCount: 50 });
  if (!value || Array.isArray(value) || typeof value !== "object")
    throw new Error("Expected a YAML mapping.");
  return value;
}
export function parseTime(value, fps = 30) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value)
    .trim()
    .match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))\s*(ms|s|f)?$/i);
  if (!match)
    throw new Error(
      `Invalid time '${value}'. Use seconds, ms or frames (e.g. 1.2s, 200ms, 30f).`,
    );
  const n = Number(match[1]);
  return match[2]?.toLowerCase() === "ms"
    ? n / 1000
    : match[2]?.toLowerCase() === "f"
      ? n / fps
      : n;
}
export function parseMotionShorthand(value, fps = 30) {
  if (!value || value === "none") return null;
  const v =
    typeof value === "object"
      ? value
      : (() => {
          const parts = String(value).trim().split(/\s+/);
          const preset = parts[0],
            duration = parts[1] ?? 0.4,
            delay = parts[2] ?? 0;
          return { preset, duration, delay, easing: parts.slice(3).join(" ") };
        })();
  return {
    preset: v.preset || "fade",
    duration: parseTime(v.duration ?? 0.4, fps),
    delay: parseTime(v.delay ?? 0, fps),
    easing: v.easing || "ease-out",
  };
}
export function parseEasing(name) {
  return name == null || typeof name !== "string" ? "ease-out" : name;
}
export function parseAnimate(value, fps = 30) {
  if (value == null) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "animate must be a mapping of property to {from, to, start, duration, easing}.",
    );
  const allowed = new Set(["opacity", "x", "y", "scale", "rotation", "blur"]);
  const tracks = [];
  for (const [prop, spec] of Object.entries(value)) {
    if (!allowed.has(prop))
      throw new Error(
        `animate.${prop} is not animatable. Use: ${[...allowed].join(", ")}.`,
      );
    const v = Array.isArray(spec) ? { from: spec[0], to: spec[1] } : spec;
    if (!v || typeof v !== "object")
      throw new Error(
        `animate.${prop} needs from and to, e.g. {from: 0, to: 1}.`,
      );
    for (const key of ["from", "to"])
      if (typeof v[key] !== "number" || !Number.isFinite(v[key]))
        throw new Error(`animate.${prop}.${key} must be a finite number.`);
    tracks.push({
      prop,
      from: v.from,
      to: v.to,
      start: parseTime(v.start ?? 0, fps),
      duration: parseTime(v.duration ?? 0.6, fps),
      easing: parseEasing(v.easing),
    });
  }
  return tracks.length ? tracks : undefined;
}
export function parseCount(value, fps = 30) {
  if (value == null) return undefined;
  if (typeof value !== "object")
    throw new Error("count must be a mapping like {to: 2400, duration: 1}.");
  if (typeof value.to !== "number" || !Number.isFinite(value.to))
    throw new Error("count.to must be a finite number.");
  return {
    from: typeof value.from === "number" ? value.from : 0,
    to: value.to,
    start: parseTime(value.start ?? 0, fps),
    duration: parseTime(value.duration ?? 1, fps),
    easing: parseEasing(value.easing),
    prefix: value.prefix == null ? "" : String(value.prefix),
    suffix: value.suffix == null ? "" : String(value.suffix),
    decimals: value.decimals == null ? 0 : Number(value.decimals),
    thousands: value.thousands !== false,
  };
}
export function parseReplace(value, fps = 30) {
  if (value == null) return undefined;
  const list = Array.isArray(value) ? value : [value];
  const entries = list
    .filter((v) => v != null)
    .map((v) => {
      if (typeof v !== "object" || typeof v.text !== "string")
        throw new Error("replace entries need {at: seconds, text: string}.");
      return { at: parseTime(v.at ?? 0, fps), text: v.text };
    });
  if (!entries.length) return undefined;
  entries.sort((a, b) => a.at - b.at);
  return entries;
}
function parseMotionPath(value, fps) {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length < 2)
    throw new Error("path needs at least two {t, x, y} points.");
  return value
    .map((point) => ({
      ...point,
      t: parseTime(point.t, fps),
      ease: point.ease === "expo-out" ? "expo.out" : point.ease || "expo.out",
    }))
    .sort((a, b) => a.t - b.t);
}
function parseKeyframes(value, fps) {
  if (value == null) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("keyframes must map properties to point lists.");
  return Object.fromEntries(
    Object.entries(value).map(([prop, points]) => [
      prop,
      Array.isArray(points)
        ? points
            .map((point) => ({
              t: parseTime(point.t, fps),
              v: Number(point.v),
              ease:
                point.ease === "expo-out"
                  ? "expo.out"
                  : point.ease || "expo.out",
            }))
            .sort((a, b) => a.t - b.t)
        : points,
    ]),
  );
}
function parseBehaviors(value, fps) {
  if (value == null) return undefined;
  if (!Array.isArray(value)) throw new Error("behaviors must be a list.");
  const aliases = {
    "blur-in": "blur",
    "focus-in": "blur",
    "mask-reveal": "mask",
    "clip-reveal": "mask",
    "path-follow": "path",
    tilt: "depth",
    float: "depth",
    parallax: "depth",
  };
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw new Error("Each behavior must be a mapping with a type.");
    const type = aliases[entry.type] || entry.type;
    const b = { ...entry, type };
    b.at = parseTime(entry.at ?? entry.start ?? 0, fps);
    b.duration = parseTime(entry.duration ?? 0.4, fps);
    b.easing = entry.easing || "expo.out";
    if (entry.period != null) b.period = parseTime(entry.period, fps);
    return b;
  });
}
function parseCursor(value, fps) {
  if (value == null) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("cursor must be a mapping.");
  if (!Array.isArray(value.actions) && !Array.isArray(value.path))
    throw new Error("cursor needs actions or a path.");
  return {
    ...value,
    path: parseMotionPath(value.path, fps),
    actions: (value.actions || [])
      .map((action) => ({
        ...action,
        at: parseTime(action.at ?? 0, fps),
        duration: parseTime(
          action.duration ?? (action.type === "click" ? 0.18 : 0.4),
          fps,
        ),
        hold: parseTime(action.hold ?? 0.07, fps),
      }))
      .sort((a, b) => a.at - b.at),
  };
}
export function sourceParts(source) {
  const front = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!front)
    throw new Error("motion.md must start with YAML frontmatter (---).");
  const body = source.slice(front[0].length);
  // Only headings outside fenced blocks are structural; HTML/CSS may contain markdown-looking lines.
  const hits = [];
  let offset = front[0].length;
  let fence = false;
  for (const line of body.split(/(?<=\n)/)) {
    if (/^```/.test(line)) fence = !fence;
    const match =
      !fence &&
      line
        .trimEnd()
        .match(
          /^##\s+scene:\s*([\w-]+)(?:\s*\(\s*([^\s]+?)\s*[-–]\s*([^\s]+?)\s*\))?\s*$/i,
        );
    if (match)
      hits.push({
        id: match[1],
        startRaw: match[2],
        endRaw: match[3],
        offset,
        bodyOffset: offset + line.length,
      });
    offset += line.length;
  }
  return {
    front,
    meta: parseYaml(front[1]),
    scenes: hits.map((s, i) => ({
      ...s,
      endOffset: hits[i + 1]?.offset ?? source.length,
      body: source.slice(s.bodyOffset, hits[i + 1]?.offset ?? source.length),
    })),
  };
}
const aspects = {
  "16:9": [1920, 1080],
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "21:9": [2560, 1080],
};
export function resolveSize(meta) {
  if (meta.width != null || meta.height != null)
    return { width: Number(meta.width), height: Number(meta.height) };
  const raw = String(
    meta.resolution ?? meta.aspect_ratio ?? meta.aspect ?? "16:9",
  );
  let pair = aspects[raw];
  if (!pair && /^\d+x\d+$/i.test(raw))
    pair = raw.toLowerCase().split("x").map(Number);
  if (!pair && /^\d+:\d+$/.test(raw)) {
    const [w, h] = raw.split(":").map(Number);
    pair =
      w >= h
        ? [1080, Math.round((1080 * h) / w)]
        : [Math.round((1080 * w) / h), 1080];
  }
  if (!pair) throw new Error(`Unknown aspect ratio '${raw}'.`);
  return { width: pair[0], height: pair[1] };
}
export function parseMotionMarkdown(source) {
  const { meta, scenes: blocks } = sourceParts(source);
  for (const key of ["assets", "theme"]) {
    if (
      meta[key] != null &&
      (typeof meta[key] !== "object" ||
        (key === "theme" && Array.isArray(meta[key])))
    )
      throw new Error(
        `${key} must be a mapping${key === "assets" ? " or asset list" : ""}.`,
      );
  }
  if (
    meta.audio != null &&
    typeof meta.audio !== "string" &&
    !Array.isArray(meta.audio) &&
    (typeof meta.audio !== "object" || !Array.isArray(meta.audio.tracks))
  )
    throw new Error(
      "audio must be a local path, a list of tracks, or {master, tracks}.",
    );
  const fps = Number(meta.fps ?? 30);
  const size = resolveSize(meta);
  const assets = Object.create(null);
  const assetInfo = [];
  const list = Array.isArray(meta.assets)
    ? meta.assets
    : Object.entries(meta.assets || {}).map(([id, v]) => ({
        id,
        ...(typeof v === "string" ? { src: v } : v),
      }));
  for (const a of list) {
    if (!a || !/^[\w-]+$/.test(a.id) || typeof a.src !== "string" || !a.src)
      throw new Error("Assets need a unique id and a src.");
    if (Object.hasOwn(assets, a.id))
      throw new Error(`Duplicate asset id '${a.id}'.`);
    assets[a.id] = a.src;
    assetInfo.push(a);
  }
  let cursor = 0;
  const scenes = blocks.map((block) => {
    if (block.startRaw != null) {
      const start = parseTime(block.startRaw, fps);
      const duration = parseTime(block.endRaw, fps) - start;
      cursor = start + duration;
      return {
        id: block.id,
        start,
        at: start,
        duration,
        transition: { type: "cut", duration: 0 },
        html: block.body.trim(),
        elements: [],
        format: "html",
      };
    }
    const fence = block.body.match(/```motion\s*\r?\n([\s\S]*?)```/);
    if (!fence)
      throw new Error(
        `Scene '${block.id}' needs a motion fence or a timed HTML heading.`,
      );
    const data = parseYaml(fence[1]);
    const duration = parseTime(data.duration ?? 2, fps);
    const start = data.at == null ? cursor : parseTime(data.at, fps);
    cursor = start + duration;
    const [type = "cut", td = 0] =
      typeof data.transition === "string" ? data.transition.split(/\s+/) : [];
    const transition =
      data.transition && typeof data.transition === "object"
        ? {
            type: data.transition.type,
            duration: parseTime(data.transition.duration ?? 0, fps),
          }
        : { type, duration: parseTime(td, fps) };
    if (data.elements != null && !Array.isArray(data.elements))
      throw new Error(`Scene '${block.id}': elements must be a list.`);
    const parseElement = (el, i, parentId) => {
      if (!el || typeof el !== "object")
        throw new Error(`Scene '${block.id}': element ${i} must be a mapping.`);
      const base = {
        ...el,
        id: el.id || `${parentId ?? block.id}-${i}`,
        type: el.type || "text",
        at: parseTime(el.at ?? 0, fps),
        duration: parseTime(
          el.duration ?? Math.max(0, duration - parseTime(el.at ?? 0, fps)),
          fps,
        ),
        enter: parseMotionShorthand(el.enter, fps),
        exit: parseMotionShorthand(el.exit, fps),
        z: el.z ?? i,
      };
      if (el.behaviors != null)
        base.behaviors = parseBehaviors(el.behaviors, fps);
      if (el.path != null) base.path = parseMotionPath(el.path, fps);
      if (el.keyframes != null)
        base.keyframes = parseKeyframes(el.keyframes, fps);
      if (el.typewriter != null)
        base.typewriter = {
          ...el.typewriter,
          from: parseTime(el.typewriter.from ?? 0, fps),
          cps: Number(el.typewriter.cps ?? 12),
        };
      if (base.type === "group") {
        if (!Array.isArray(el.children))
          throw new Error(
            `Scene '${block.id}': group '${base.id}' needs a children list.`,
          );
        base.children = el.children.map((child, j) =>
          parseElement(child, j, base.id),
        );
      }
      if (el.animate != null) base.animate = parseAnimate(el.animate, fps);
      if (el.count != null) base.count = parseCount(el.count, fps);
      if (el.replace != null) base.replace = parseReplace(el.replace, fps);
      return base;
    };
    const elements = (data.elements || []).map((el, i) => parseElement(el, i));
    return {
      id: block.id,
      kind: data.kind || null,
      start,
      at: data.at == null ? null : start,
      duration,
      transition,
      camera: data.camera
        ? {
            ...data.camera,
            type: data.camera.type || "push",
            duration: parseTime(data.camera.duration ?? duration, fps),
            lag: parseTime(data.camera.lag ?? 0, fps),
          }
        : undefined,
      cursor: parseCursor(data.cursor, fps),
      events: data.events
        ? Object.fromEntries(
            Object.entries(data.events).map(([id, event]) => [
              id,
              start +
                parseTime(typeof event === "object" ? event.at : event, fps),
            ]),
          )
        : undefined,
      elements,
      format: "motion",
    };
  });
  const events = Object.fromEntries(
    Object.entries(meta.events || {}).map(([id, event]) => [
      id,
      parseTime(typeof event === "object" ? event.at : event, fps),
    ]),
  );
  for (const scene of scenes) {
    Object.assign(events, scene.events || {});
    for (const action of scene.cursor?.actions || [])
      if (action.event) events[action.event] = scene.start + action.at;
    for (const point of scene.cursor?.path || [])
      if (point.event) events[point.event] = scene.start + point.t;
  }
  const audioList =
    typeof meta.audio === "string"
      ? [{ src: meta.audio }]
      : Array.isArray(meta.audio)
        ? meta.audio
        : meta.audio?.tracks || [];
  const audioMaster = {
    lufs: Number(meta.audio?.master?.lufs ?? -16),
    peak: Number(meta.audio?.master?.peak ?? -1.5),
    sample_rate: Number(meta.audio?.master?.sample_rate ?? 48000),
  };
  const cueTimes = (name) => {
    if (typeof name === "string" && name.startsWith("event:")) {
      const at = events[name.slice(6)];
      if (at == null) throw new Error(`Unknown audio event '${name}'.`);
      return [at];
    }
    if (name === "cuts")
      return [
        ...new Set(
          scenes.flatMap((s, i) => [
            ...(i > 0 && s.transition.type === "cut" ? [s.start] : []),
            ...s.elements
              .filter((el) => el.type === "video")
              .map((el) => s.start + el.at),
          ]),
        ),
      ]
        .sort((a, b) => a - b)
        .filter((t, i, all) => i === 0 || t - all[i - 1] >= 0.08);
    if (name === "rises")
      return scenes.flatMap((s) =>
        s.elements
          .filter((el) => el.enter?.preset === "rise")
          .map((el) => s.start + el.at + el.enter.delay),
      );
    return null;
  };
  const audio = audioList.flatMap((a, trackIndex) => {
    const rawAt = a.start ?? a.at ?? 0;
    const times = cueTimes(rawAt) ?? (Array.isArray(a.at) ? a.at : [rawAt]);
    return times.map((time, cueIndex) => {
      const at = parseTime(time, fps);
      const end = a.end == null ? null : parseTime(a.end, fps);
      return {
        ...a,
        id: a.id || `audio-${trackIndex + 1}`,
        cue: times.length > 1 ? cueIndex + 1 : null,
        kind: a.kind || "music",
        src: a.src,
        at,
        trim: parseTime(a.trim ?? 0, fps),
        duration:
          a.duration != null
            ? parseTime(a.duration, fps)
            : end != null
              ? end - at
              : null,
        volume: Number(a.volume ?? 1),
        gain_db: Number(a.gain_db ?? 0),
        fade_in: parseTime(a.fade_in ?? 0, fps),
        fade_out: parseTime(a.fade_out ?? 0, fps),
        duck_under: Array.isArray(a.duck_under) ? a.duck_under.map(String) : [],
        duck_db: Number(a.duck_db ?? -8),
        oneshot: Boolean(a.oneshot || times.length > 1),
      };
    });
  });
  const recipe = resolveRecipe(meta.recipe);
  return {
    id: meta.id || "composition",
    title: meta.title || "Untitled motion",
    version: meta.version ?? 1,
    ...size,
    aspect: meta.aspect ?? meta.aspect_ratio ?? `${size.width}:${size.height}`,
    fps,
    duration: parseTime(meta.duration ?? cursor, fps),
    background: meta.background || recipe?.ground || "#000000",
    safe_area: Number(meta.safe_area ?? 64),
    theme: {
      accent: recipe?.ink || "#7C5CFF",
      text: recipe?.ink || "#F5F5F7",
      muted: recipe?.muted || "#A1A1AA",
      font_display: recipe?.font || "Inter, ui-sans-serif, system-ui",
      font_body: recipe?.font || "Inter, ui-sans-serif, system-ui",
      ...meta.theme,
    },
    ...(meta.brand ? { brand: meta.brand } : {}),
    recipeId: meta.recipe || null,
    recipe,
    ...(Object.keys(events).length ? { events } : {}),
    ...(meta.paths ? { paths: meta.paths } : {}),
    assets,
    assetInfo,
    audio,
    audioMaster,
    catalogPath: meta.catalog || null,
    scenes,
    rawMeta: meta,
  };
}
