const presets = new Set([
  "fade",
  "fade-up",
  "fade-down",
  "scale-fade",
  "blur-in",
  "wipe-left",
  "wipe-up",
  "slide-left",
  "slide-right",
  "pop",
  "zoom-out",
  "rotate-in",
  "none",
]);
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
    for (const m of (scene.html || "").matchAll(/asset:(?:\/\/)?([\w-]+)/g))
      ref(m[0], `Scene '${scene.id}'`);
    for (const el of scene.elements) {
      if (!/^[\w-]+$/.test(el.id) || ids.has(el.id))
        errors.push(`Invalid or duplicate element id '${el.id}'.`);
      ids.add(el.id);
      if (!["text", "caption", "shape", "image", "html"].includes(el.type))
        errors.push(`Unknown type '${el.type}'.`);
      if (
        !Number.isFinite(el.at) ||
        el.at < 0 ||
        !positive(el.duration) ||
        el.at + el.duration > scene.duration + 1e-6
      )
        errors.push(`Element '${el.id}' must fit within its scene.`);
      if (el.type === "image") ref(el.src, `Image '${el.id}'`);
      for (const m of (el.html || "").matchAll(/asset:(?:\/\/)?([\w-]+)/g))
        ref(m[0], `Element '${el.id}'`);
      for (const m of [el.enter, el.exit])
        if (
          m &&
          (!presets.has(m.preset) ||
            !Number.isFinite(m.duration) ||
            m.duration < 0 ||
            !Number.isFinite(m.delay) ||
            m.delay < 0 ||
            ![
              "linear",
              "ease-out",
              "ease-in",
              "ease-in-out",
              "expo.out",
            ].includes(m.easing))
        )
          errors.push(`Element '${el.id}' has invalid animation settings.`);
      for (const key of ["opacity", "scale", "rotation", "font_size"])
        if (el[key] != null && !Number.isFinite(el[key]))
          errors.push(`${el.id}.${key} must be a number.`);
      if (el.opacity != null && (el.opacity < 0 || el.opacity > 1))
        errors.push(`${el.id}.opacity must be between 0 and 1.`);
      if (el.split != null && !["words", "chars", "lines"].includes(el.split))
        errors.push(`${el.id}.split must be words, chars, or lines.`);
      if (
        el.stagger != null &&
        (!Number.isFinite(el.stagger) || el.stagger < 0)
      )
        errors.push(
          `${el.id}.stagger must be a non-negative number of seconds.`,
        );
    }
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
    if (
      ![a.at, a.trim, a.volume].every((v) => Number.isFinite(v) && v >= 0) ||
      a.at >= comp.duration ||
      (a.duration != null && !positive(a.duration))
    )
      errors.push(
        "Audio timing and volume must be non-negative and fit the composition.",
      );
  }
  for (const id of Object.keys(comp.assets))
    if (!used.has(id)) warnings.push(`Asset '${id}' is declared but unused.`);
  return { ok: !errors.length, errors, warnings };
}
export function describeComposition(comp) {
  return { ...comp, rawMeta: undefined, sourcePath: undefined };
}
export function assertValid(comp) {
  const d = validateComposition(comp);
  if (!d.ok) throw new Error(d.errors.join("\n"));
  return d;
}
