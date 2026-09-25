import { scoreComposition } from "./score.mjs";

const presets = new Set([
  "fade",
  "fade-up",
  "fade-down",
  "scale-fade",
  "rise",
  "blur-in",
  "fade-blur",
  "tilt-in",
  "wipe-left",
  "wipe-up",
  "slide-left",
  "slide-right",
  "pop",
  "zoom-out",
  "rotate-in",
  "reveal",
  "type",
  "draw",
  "none",
]);
const springPattern = /^spring\(\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)$/;
const bezierPattern =
  /^cubic-bezier\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\)$/;
const easingOk = (easing) =>
  [
    "linear",
    "ease-out",
    "ease-in",
    "ease-in-out",
    "expo.out",
    "spring",
    "spring.soft",
    "spring.snappy",
  ].includes(easing) ||
  springPattern.test(easing) ||
  bezierPattern.test(easing);
const elementTypes = new Set([
  "text",
  "caption",
  "shape",
  "image",
  "video",
  "svg",
  "html",
  "group",
  "brand-lockup",
]);
const animateProps = new Set([
  "opacity",
  "x",
  "y",
  "scale",
  "rotation",
  "blur",
]);
const keyframeProps = new Set([...animateProps, "rotateX", "rotateY"]);
const coordinateOk = (value) =>
  (typeof value === "number" && Number.isFinite(value)) ||
  (typeof value === "string" && /^-?\d+(?:\.\d+)?%$/.test(value));
const motionPathOk = (path, limit) =>
  Array.isArray(path) &&
  path.length >= 2 &&
  path.every(
    (point, index) =>
      Number.isFinite(point.t) &&
      point.t >= 0 &&
      point.t <= limit &&
      (index === 0 || point.t > path[index - 1].t) &&
      coordinateOk(point.x) &&
      coordinateOk(point.y) &&
      easingOk(point.ease),
  );
export function validateComposition(comp) {
  const errors = [],
    warnings = [],
    ids = new Set(),
    sceneIds = new Set(),
    used = new Set();
  const positive = (v) => Number.isFinite(v) && v > 0;
  if (comp.version !== 1) errors.push("Only motion.md version 1 is supported.");
  for (const key of ["title", "background"])
    if (typeof comp[key] !== "string" || !comp[key])
      errors.push(`${key} must be a non-empty string.`);
  for (const [key, value] of Object.entries(comp.theme))
    if (typeof value !== "string")
      errors.push(`theme.${key} must be a string.`);
  for (const key of ["width", "height", "fps"])
    if (!Number.isInteger(comp[key]) || !positive(comp[key]))
      errors.push(`${key} must be a positive integer.`);
  if (comp.width > 8192 || comp.height > 8192)
    errors.push("Maximum canvas dimension is 8192px.");
  if (comp.fps > 120) errors.push("Maximum fps is 120.");
  if (!positive(comp.duration))
    errors.push("Duration must be finite and greater than zero.");
  if (!Number.isFinite(comp.safe_area) || comp.safe_area < 0)
    errors.push("safe_area must be non-negative.");
  if (!comp.scenes.length) errors.push("No scenes found.");
  for (const [id, at] of Object.entries(comp.events || {}))
    if (
      !/^[\w-]+$/.test(id) ||
      !Number.isFinite(at) ||
      at < 0 ||
      at >= comp.duration
    )
      errors.push(
        `Event '${id}' must have a valid id and time inside the video.`,
      );
  for (const [id, path] of Object.entries(comp.paths || {}))
    if (
      !/^[\w-]+$/.test(id) ||
      path?.type !== "bezier" ||
      !Array.isArray(path.points) ||
      path.points.length !== 4 ||
      !path.points.every(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          point.every(Number.isFinite),
      )
    )
      errors.push(`Path '${id}' needs four finite Bézier points.`);
  const ref = (src, where) => {
    if (typeof src !== "string" || !src) {
      errors.push(`${where} needs a source.`);
      return;
    }
    const m = src.match(/^asset:(?:\/\/)?(.+)$/);
    if (m) {
      used.add(m[1]);
      if (!Object.hasOwn(comp.assets, m[1]))
        errors.push(`${where} references unknown asset '${m[1]}'.`);
    }
  };
  if (comp.brand != null) {
    const brand = comp.brand;
    if (!brand || typeof brand !== "object" || Array.isArray(brand))
      errors.push("brand must be a mapping.");
    else {
      if (brand.accent != null && typeof brand.accent !== "string")
        errors.push("brand.accent must be a color string.");
      if (brand.radius != null && !positive(Number(brand.radius)))
        errors.push("brand.radius must be positive.");
      if (
        brand.spacing != null &&
        (!Array.isArray(brand.spacing) ||
          !brand.spacing.every((value) => positive(Number(value))))
      )
        errors.push("brand.spacing must be positive numbers.");
      if (
        brand.typeScale != null &&
        (!brand.typeScale ||
          typeof brand.typeScale !== "object" ||
          Array.isArray(brand.typeScale) ||
          !Object.values(brand.typeScale).every((value) =>
            positive(Number(value)),
          ))
      )
        errors.push("brand.typeScale must map names to positive sizes.");
      if (brand.logoLockup != null) {
        const lock = brand.logoLockup;
        if (!lock || typeof lock !== "object" || Array.isArray(lock))
          errors.push("brand.logoLockup must be a mapping.");
        else {
          ref(lock.mark, "brand.logoLockup.mark");
          if (typeof lock.wordmark !== "string" || !lock.wordmark)
            errors.push("brand.logoLockup.wordmark is required.");
          for (const key of ["markWidth", "markHeight", "fontSize", "gap"])
            if (
              !Number.isFinite(Number(lock[key])) ||
              Number(lock[key]) < 0 ||
              (key !== "gap" && Number(lock[key]) === 0)
            )
              errors.push(`brand.logoLockup.${key} must be a valid size.`);
          if (lock.tracking != null && typeof lock.tracking !== "string")
            errors.push("brand.logoLockup.tracking must be a CSS string.");
        }
      }
    }
  }
  let covered = 0;
  for (const scene of [...comp.scenes].sort((a, b) => a.start - b.start)) {
    if (sceneIds.has(scene.id)) errors.push(`Duplicate scene '${scene.id}'.`);
    sceneIds.add(scene.id);
    if (
      !positive(scene.duration) ||
      !Number.isFinite(scene.start) ||
      scene.start < 0
    )
      errors.push(`Scene '${scene.id}' has invalid timing.`);
    if (scene.start + scene.duration > comp.duration + 1e-6)
      errors.push(`Scene '${scene.id}' ends after composition duration.`);
    if (scene.start > covered + 1e-6)
      warnings.push(`Gap before '${scene.id}' (${covered}s–${scene.start}s).`);
    if (scene.start < covered - 1e-6)
      warnings.push(`Scene '${scene.id}' overlaps a previous scene.`);
    covered = Math.max(covered, scene.start + scene.duration);
    if (
      !["cut", "fade", "wipe-left", "wipe-up", "slide-left", "zoom"].includes(
        scene.transition.type,
      ) ||
      !Number.isFinite(scene.transition.duration) ||
      scene.transition.duration < 0 ||
      scene.transition.duration > scene.duration
    )
      errors.push(`Scene '${scene.id}' has an invalid transition.`);
    if (scene.format === "html" && !scene.html)
      warnings.push(`Scene '${scene.id}' has no HTML.`);
    if (scene.camera) {
      const camera = scene.camera;
      if (
        camera.type !== "push" ||
        ![
          camera.from ?? 1,
          camera.to ?? 1.04,
          camera.duration,
          camera.lag,
          camera.strength ?? 0,
        ].every(Number.isFinite) ||
        (camera.from ?? 1) <= 0 ||
        (camera.to ?? 1.04) <= 0 ||
        camera.duration <= 0 ||
        camera.lag < 0 ||
        ![undefined, "cursor"].includes(camera.follow)
      )
        errors.push(`Scene '${scene.id}' has invalid camera push settings.`);
      if (camera.follow === "cursor" && !scene.cursor)
        errors.push(`Scene '${scene.id}' camera follows a missing cursor.`);
      if (
        camera.anchor != null &&
        camera.anchor !== "center" &&
        camera.anchor !== "cursor" &&
        !(
          Array.isArray(camera.anchor) &&
          camera.anchor.length === 2 &&
          camera.anchor.every(coordinateOk)
        )
      )
        errors.push(`Scene '${scene.id}' has an invalid camera anchor.`);
    }
    if (scene.cursor) {
      const cursor = scene.cursor;
      if (!Array.isArray(cursor.actions))
        errors.push(`Scene '${scene.id}' cursor needs actions.`);
      else
        for (const action of cursor.actions) {
          if (
            !["move", "click"].includes(action.type) ||
            !Number.isFinite(action.at) ||
            !Number.isFinite(action.duration) ||
            action.at < 0 ||
            action.duration <= 0 ||
            action.at + action.duration > scene.duration + 1e-6 ||
            (action.type === "move" &&
              !(
                Array.isArray(action.to) &&
                action.to.length === 2 &&
                action.to.every(
                  (v) => typeof v === "number" || typeof v === "string",
                )
              ) &&
              !(typeof action.to === "string" && action.to.startsWith("#"))) ||
            (action.event && !Object.hasOwn(comp.events || {}, action.event))
          )
            errors.push(`Scene '${scene.id}' has invalid cursor action.`);
        }
      if (cursor.path && !motionPathOk(cursor.path, scene.duration))
        errors.push(`Scene '${scene.id}' has an invalid cursor path.`);
    }
    for (const m of (scene.html || "").matchAll(/asset:(?:\/\/)?([\w.-]+)/g))
      ref(m[0], `Scene '${scene.id}'`);
    const checkElement = (el, depth = 0) => {
      if (!/^[\w-]+$/.test(el.id) || ids.has(el.id))
        errors.push(`Invalid or duplicate element id '${el.id}'.`);
      ids.add(el.id);
      if (!elementTypes.has(el.type)) errors.push(`Unknown type '${el.type}'.`);
      if (
        !Number.isFinite(el.at) ||
        el.at < 0 ||
        !positive(el.duration) ||
        el.at + el.duration > scene.duration + 1e-6
      )
        errors.push(`Element '${el.id}' must fit within its scene.`);
      if (el.type === "image") ref(el.src, `Image '${el.id}'`);
      if (el.type === "brand-lockup" && !comp.brand?.logoLockup)
        errors.push(`Brand lockup '${el.id}' needs brand.logoLockup.`);
      if (el.type === "video") ref(el.src, `Video '${el.id}'`);
      if (el.type === "video" && !/^asset:(?:\/\/)?[\w.-]+$/.test(el.src || ""))
        errors.push(`Video '${el.id}' must use a catalog asset id.`);
      if (el.type === "video" && comp.catalogPath) {
        const id = el.src?.replace(/^asset:(?:\/\/)?/, "");
        const entry = comp.catalog?.[id];
        if (!entry || entry.kind !== "video" || !(entry.dur > 0))
          errors.push(
            `Video '${el.id}' needs a catalog video with positive dur.`,
          );
      }
      if (el.move != null && el.move !== "push")
        errors.push(`${el.id}.move must be push.`);
      if (
        el.move === "push" &&
        (![el.from ?? 1, el.to ?? 1.04].every(Number.isFinite) ||
          (el.from ?? 1) <= 0 ||
          (el.to ?? 1.04) <= 0)
      )
        errors.push(`${el.id}.move push needs positive from/to scales.`);
      for (const m of ((el.html || "") + (el.svg || "")).matchAll(
        /asset:(?:\/\/)?([\w.-]+)/g,
      ))
        ref(m[0], `Element '${el.id}'`);
      for (const m of [el.enter, el.exit])
        if (
          m &&
          (!presets.has(m.preset) ||
            !Number.isFinite(m.duration) ||
            m.duration < 0 ||
            !Number.isFinite(m.delay) ||
            m.delay < 0 ||
            !easingOk(m.easing))
        )
          errors.push(`Element '${el.id}' has invalid animation settings.`);
      for (const key of ["opacity", "scale", "rotation", "font_size", "blur"])
        if (el[key] != null && !Number.isFinite(el[key]))
          errors.push(`${el.id}.${key} must be a number.`);
      if (el.blur != null && el.blur < 0)
        errors.push(`${el.id}.blur must be non-negative.`);
      if (el.opacity != null && (el.opacity < 0 || el.opacity > 1))
        errors.push(`${el.id}.opacity must be between 0 and 1.`);
      if (el.split != null && !["words", "chars", "lines"].includes(el.split))
        errors.push(`${el.id}.split must be words, chars, or lines.`);
      if (
        el.distribution != null &&
        (el.distribution !== "glyphs" ||
          !["text", "caption"].includes(el.type) ||
          !(el.behaviors || []).some((b) => b.type === "path"))
      )
        errors.push(`${el.id}.distribution requires glyphs on a text path.`);
      if (
        el.spacing != null &&
        (!Number.isFinite(el.spacing) || el.spacing <= 0 || el.spacing > 0.5)
      )
        errors.push(`${el.id}.spacing must be between 0 and 0.5.`);
      if (
        el.stagger != null &&
        (!Number.isFinite(el.stagger) || el.stagger < 0)
      )
        errors.push(
          `${el.id}.stagger must be a non-negative number of seconds.`,
        );
      if (el.animate != null) {
        if (!Array.isArray(el.animate))
          errors.push(`${el.id}.animate must be a list of tracks.`);
        else
          for (const track of el.animate) {
            if (
              !animateProps.has(track.prop) ||
              ![track.from, track.to].every(Number.isFinite) ||
              !Number.isFinite(track.start) ||
              track.start < 0 ||
              !positive(track.duration) ||
              !easingOk(track.easing)
            )
              errors.push(
                `${el.id}.animate.${track.prop ?? "?"} is invalid: from/to must be finite numbers, start non-negative, duration positive, easing one of linear, ease-in, ease-out, ease-in-out, expo.out or spring(f, d).`,
              );
            else if (track.start + track.duration > el.duration + 1e-6)
              warnings.push(
                `${el.id}.animate.${track.prop} extends past the element's duration.`,
              );
          }
      }
      if (el.path && !motionPathOk(el.path, el.duration))
        errors.push(
          `${el.id}.path needs timed canvas points within the layer.`,
        );
      if (
        el.typewriter &&
        (!["text", "caption"].includes(el.type) ||
          !Number.isFinite(el.typewriter.cps) ||
          el.typewriter.cps <= 0 ||
          el.typewriter.cps > 60 ||
          !Number.isFinite(el.typewriter.from) ||
          el.typewriter.from < 0 ||
          el.typewriter.from >= el.duration ||
          el.split ||
          el.distribution)
      )
        errors.push(
          `${el.id}.typewriter needs text, cps 1–60, and a start within the layer.`,
        );
      if (el.keyframes)
        for (const [prop, points] of Object.entries(el.keyframes))
          if (
            !keyframeProps.has(prop) ||
            !Array.isArray(points) ||
            points.length < 2 ||
            !points.every(
              (point, index) =>
                Number.isFinite(point.t) &&
                point.t >= 0 &&
                point.t <= el.duration &&
                (index === 0 || point.t > points[index - 1].t) &&
                Number.isFinite(point.v) &&
                easingOk(point.ease),
            )
          )
            errors.push(
              `${el.id}.keyframes.${prop} needs ordered finite {t, v} points.`,
            );
      for (const behavior of el.behaviors || []) {
        const where = `${el.id}.behaviors.${behavior.type}`;
        if (
          !["blur", "mask", "depth", "path", "compress"].includes(
            behavior.type,
          ) ||
          !Number.isFinite(behavior.at) ||
          behavior.at < 0 ||
          !Number.isFinite(behavior.duration) ||
          behavior.duration <= 0 ||
          !easingOk(behavior.easing) ||
          (behavior.on && !Object.hasOwn(comp.events || {}, behavior.on))
        )
          errors.push(`${where} has invalid type, timing, easing, or event.`);
        if (
          behavior.type === "blur" &&
          ![behavior.from ?? 18, behavior.to ?? 0].every(
            (v) => Number.isFinite(v) && v >= 0 && v <= 80,
          )
        )
          errors.push(`${where} needs blur from/to between 0 and 80px.`);
        if (
          behavior.type === "mask" &&
          (!["circle", "rect", "line"].includes(behavior.shape ?? "circle") ||
            ![behavior.from ?? 0, behavior.to ?? 140].every(
              (v) => Number.isFinite(v) && v >= 0 && v <= 200,
            ))
        )
          errors.push(`${where} needs a supported shape and finite from/to.`);
        if (
          behavior.type === "depth" &&
          ![
            behavior.perspective ?? 1200,
            behavior.tilt_x ?? 0,
            behavior.tilt_y ?? 0,
            behavior.float_y ?? 0,
            behavior.period ?? 3.2,
          ].every(Number.isFinite)
        )
          errors.push(`${where} needs finite depth settings.`);
        if (behavior.type === "path") {
          const points = behavior.points || comp.paths?.[behavior.path]?.points;
          if (
            !Array.isArray(points) ||
            points.length !== 4 ||
            !points.every(
              (point) =>
                Array.isArray(point) &&
                point.length === 2 &&
                point.every(Number.isFinite),
            )
          )
            errors.push(`${where} needs four Bézier points or a named path.`);
        }
        if (
          behavior.type === "compress" &&
          (!Number.isFinite(behavior.scale ?? 0.97) ||
            (behavior.scale ?? 0.97) <= 0 ||
            (behavior.scale ?? 0.97) > 1)
        )
          errors.push(`${where} needs scale between 0 and 1.`);
      }
      if (el.count != null) {
        const c = el.count;
        if (
          !Number.isFinite(c.to) ||
          !Number.isFinite(c.from) ||
          !Number.isFinite(c.start) ||
          c.start < 0 ||
          !positive(c.duration) ||
          !easingOk(c.easing) ||
          !Number.isInteger(c.decimals) ||
          c.decimals < 0 ||
          typeof c.prefix !== "string" ||
          typeof c.suffix !== "string"
        )
          errors.push(
            `${el.id}.count needs finite from/to, start >= 0, positive duration, integer decimals and string prefix/suffix.`,
          );
      }
      if (el.replace != null) {
        if (!Array.isArray(el.replace) || !el.replace.length)
          errors.push(`${el.id}.replace must be a non-empty list.`);
        else
          for (const r of el.replace)
            if (
              !Number.isFinite(r.at) ||
              r.at < 0 ||
              r.at > el.duration + 1e-6 ||
              typeof r.text !== "string"
            )
              errors.push(
                `${el.id}.replace entries need at within the element and a text string.`,
              );
      }
      if (el.type === "group") {
        if (!Array.isArray(el.children) || !el.children.length)
          errors.push(`Group '${el.id}' needs a children list.`);
        else for (const child of el.children) checkElement(child, depth + 1);
      }
      if (depth > 3) errors.push(`Group '${el.id}' nests too deeply.`);
    };
    for (const el of scene.elements) checkElement(el);
    const html =
      (scene.html || "") + scene.elements.map((e) => e.html || "").join("");
    if (
      /set(?:Timeout|Interval)\s*\(|requestAnimationFrame\s*\(|Date\.now\s*\(|Math\.random\s*\(/.test(
        html,
      )
    )
      warnings.push(
        `Scene '${scene.id}' uses wall-clock time or randomness. Use motion.onFrame for reproducible rendering.`,
      );
    if (/<(?:audio|video)\b/i.test(html))
      errors.push(
        `Scene '${scene.id}': embedded audio/video is not supported in v1. Use frontmatter audio tracks.`,
      );
  }
  if (covered < comp.duration - 1e-6)
    warnings.push(`Trailing gap from ${covered}s to ${comp.duration}s.`);
  for (const a of comp.audio) {
    ref(a.src, "Audio");
    if (!["voice", "music", "sting", "whoosh", "room"].includes(a.kind))
      errors.push(`Audio track '${a.id}' has unknown kind '${a.kind}'.`);
    if (
      ![a.at, a.trim, a.volume, a.fade_in, a.fade_out].every(
        (v) => Number.isFinite(v) && v >= 0,
      ) ||
      !Number.isFinite(a.gain_db) ||
      !Number.isFinite(a.duck_db) ||
      a.at >= comp.duration ||
      (a.duration != null && !positive(a.duration))
    )
      errors.push(
        "Audio timing and volume must be non-negative and fit the composition.",
      );
  }
  if (
    !Number.isFinite(comp.audioMaster?.lufs) ||
    !Number.isFinite(comp.audioMaster?.peak) ||
    !Number.isInteger(comp.audioMaster?.sample_rate) ||
    comp.audioMaster.sample_rate <= 0
  )
    errors.push(
      "audio.master needs finite lufs/peak and a positive integer sample_rate.",
    );
  const voices = comp.audio.filter((a) => a.kind === "voice");
  if (voices.length)
    for (const a of comp.audio)
      if (a.kind === "music" && a.gain_db > -16)
        errors.push(
          `Audio music track '${a.id}' must be at or below -16dB when voice is present.`,
        );
  const stings = comp.audio
    .filter((a) => a.kind === "sting")
    .sort((a, b) => a.at - b.at);
  for (let i = 1; i < stings.length; i++)
    if (stings[i].at - stings[i - 1].at < 0.08)
      errors.push(
        `Audio stings '${stings[i - 1].id}' and '${stings[i].id}' are less than 80ms apart.`,
      );
  if (comp.recipeId === "openai") {
    if (!["#ffffff", "#0d0d0d"].includes(comp.background.toLowerCase()))
      errors.push("openai recipe ground must be #FFFFFF or #0D0D0D.");
    if (
      !["#111111", "#ffffff", "#000000"].includes(
        comp.theme.accent.toLowerCase(),
      )
    )
      errors.push(
        "openai recipe accent must be ink or white; violet is forbidden.",
      );
    if (/\binter\b/i.test(comp.theme.font_display))
      errors.push("openai recipe forbids Inter as the display font.");
    for (const a of comp.audio)
      if (a.kind === "whoosh")
        errors.push("openai recipe forbids whoosh tracks.");
    for (const scene of comp.scenes) {
      if (scene.transition.type !== "cut" && scene.transition.duration > 0.12)
        errors.push(
          `openai recipe scene '${scene.id}' transition must be a cut or at most 120ms.`,
        );
      const flat = (els) =>
        els.flatMap((el) => [el, ...(el.children ? flat(el.children) : [])]);
      const elements = flat(scene.elements);
      const entrances = elements.filter(
        (el) => el.enter && el.enter.preset !== "none",
      );
      if (entrances.length > 1)
        errors.push(
          `openai recipe scene '${scene.id}' has ${entrances.length} entrances; use one.`,
        );
      for (const el of elements) {
        if (["fade-up", "blur-in", "pop"].includes(el.enter?.preset))
          errors.push(
            `openai recipe forbids '${el.enter.preset}' on '${el.id}'; use rise.`,
          );
      }
    }
  }
  const score = scoreComposition(comp);
  if (score && !score.ok)
    errors.push(
      `Recipe '${comp.recipeId}' score ${score.score}/10: ${score.checks
        .filter((c) => !c.pass)
        .map((c) => c.id)
        .join(", ")}.`,
    );
  if (score) warnings.push(...score.warnings);
  for (const family of [comp.theme?.font_display, comp.theme?.font_body])
    if (family && Object.hasOwn(comp.assets, family)) used.add(family);
  for (const id of Object.keys(comp.assets))
    if (!used.has(id) && !Object.hasOwn(comp.catalog || {}, id))
      warnings.push(`Asset '${id}' is declared but unused.`);
  return { ok: !errors.length, errors, warnings };
}
export function describeComposition(comp) {
  return {
    ...comp,
    cueSheet: comp.audio.map((a) => ({
      id: a.id,
      kind: a.kind,
      cue: a.cue,
      at: a.at,
      label: `${a.id}${a.cue ? ` #${a.cue}` : ""} @ ${a.at}s`,
    })),
    rawMeta: undefined,
    sourcePath: undefined,
    score: scoreComposition(comp),
  };
}
export function assertValid(comp) {
  const d = validateComposition(comp);
  if (!d.ok) throw new Error(d.errors.join("\n"));
  return d;
}
