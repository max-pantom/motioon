const PRESETS = new Set(["fade", "fade-up", "fade-down", "scale-fade", "blur-in", "wipe-left", "none"]);
const TYPES = new Set(["text", "image", "shape", "html", "caption"]);

export function validateComposition(comp) {
  const errors = [];
  const warnings = [];
  const ids = new Set();

  if (!comp.scenes.length) errors.push("No scenes found. Use `## scene:id` plus a ```motion fence.");
  if (!comp.width || !comp.height) errors.push("Could not resolve width/height from aspect.");
  if (comp.duration <= 0) errors.push("Composition duration must be > 0.");

  let end = 0;
  for (const scene of comp.scenes) {
    if (!scene.duration || scene.duration <= 0) errors.push(`Scene '${scene.id}' needs a duration.`);
    end = Math.max(end, scene.start + scene.duration);
    const local = new Set();
    for (const el of scene.elements) {
      if (local.has(el.id) || ids.has(el.id)) errors.push(`Duplicate element id '${el.id}'.`);
      local.add(el.id);
      ids.add(el.id);
      if (!TYPES.has(el.type)) errors.push(`Element '${el.id}' has unknown type '${el.type}'.`);
      if (el.enter && !PRESETS.has(el.enter.preset)) {
        warnings.push(`Element '${el.id}' uses unknown enter preset '${el.enter.preset}'.`);
      }
      if (el.exit && !PRESETS.has(el.exit.preset)) {
        warnings.push(`Element '${el.id}' uses unknown exit preset '${el.exit.preset}'.`);
      }
      if (el.type === "image") {
        const src = el.src || "";
        if (src.startsWith("asset:")) {
          const name = src.slice(6);
          if (!comp.assets[name]) errors.push(`Element '${el.id}' references missing asset '${name}'.`);
        } else if (!src) {
          errors.push(`Image '${el.id}' needs src.`);
        }
      }
      if (el.type === "html" && /set(Timeout|Interval)\s*\(/.test(el.html || "")) {
        warnings.push(`HTML element '${el.id}' uses timers. Renders will not be deterministic.`);
      }
      if (el.at + (el.duration || 0) > scene.duration + 1e-6) {
        warnings.push(`Element '${el.id}' extends past scene '${scene.id}'.`);
      }
    }
  }

  if (comp.duration + 1e-6 < end) {
    warnings.push(`Frontmatter duration (${comp.duration}s) is shorter than scene stack (${end}s).`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function describeComposition(comp) {
  return {
    id: comp.id,
    title: comp.title,
    size: `${comp.width}x${comp.height}`,
    aspect: comp.aspect,
    fps: comp.fps,
    duration: comp.duration,
    scenes: comp.scenes.map((s) => ({
      id: s.id,
      start: s.start,
      duration: s.duration,
      transition: s.transition,
      elements: s.elements.map((el) => ({
        id: el.id,
        type: el.type,
        at: el.at,
        duration: el.duration,
        enter: el.enter?.preset || null,
        text: el.text || null,
        src: el.src || null,
      })),
    })),
    assets: Object.keys(comp.assets),
    audio: comp.audio.map((a) => a.id || a.src),
  };
}
