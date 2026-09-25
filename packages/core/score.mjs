const flat = (elements) =>
  elements.flatMap((el) => [el, ...flat(el.children || [])]);
const isText = (el) => ["text", "caption"].includes(el.type);

export function scoreComposition(comp) {
  if (comp.recipeId !== "openai-launch") return null;
  const scenes = [...comp.scenes].sort((a, b) => a.start - b.start);
  const checks = [];
  const add = (id, pass, message) => checks.push({ id, pass, message });
  const ui = scenes.filter(
    (s) =>
      s.kind === "ui" || flat(s.elements).some((el) => el.type === "video"),
  );
  const cards = scenes.filter((s) => !ui.includes(s));
  const all = scenes.flatMap((s) => flat(s.elements));
  add(
    "real-product",
    ui.some((s) =>
      flat(s.elements).some(
        (el) =>
          ["image", "video"].includes(el.type) && /^asset:/.test(el.src || ""),
      ),
    ),
    "Include a cataloged UI image or video shot.",
  );
  add(
    "hard-cuts",
    scenes.every((s) => s.transition.type === "cut"),
    "Use hard cuts between shots.",
  );
  add(
    "hold",
    scenes.some((s) => s.duration >= 1.6),
    "Hold at least one shot for 1.6s.",
  );
  add(
    "no-fade-up",
    all.every((el) => el.enter?.preset !== "fade-up"),
    "Avoid fade-up entrances.",
  );
  add(
    "sparse-card-copy",
    cards.every((s) => flat(s.elements).filter(isText).length <= 2),
    "Keep cards to two text layers or fewer.",
  );
  add(
    "card-colors",
    cards.every(
      (s) =>
        new Set(
          [
            comp.background,
            ...flat(s.elements)
              .flatMap((el) => [el.color, el.fill])
              .filter(Boolean),
          ].map((c) => c.toLowerCase()),
        ).size <= 3,
    ),
    "Limit each card to ground, ink and one muted color.",
  );
  add(
    "one-entrance",
    scenes.every(
      (s) =>
        flat(s.elements).filter((el) => el.enter && el.enter.preset !== "none")
          .length <= 1,
    ),
    "Use at most one entrance per shot.",
  );
  add(
    "brief-move",
    all.every((el) => !el.enter || el.enter.duration <= 0.4),
    "Keep entrance motion within 400ms.",
  );
  const cuts = scenes.slice(1).map((s) => s.start);
  add(
    "cut-cues",
    cuts.every((t) =>
      comp.audio.some(
        (a) => a.kind === "sting" && Math.abs(a.at - t) <= 1 / comp.fps + 1e-6,
      ),
    ),
    "Place a sting within one frame of every cut.",
  );
  add(
    "quiet-bed",
    comp.audio.every((a) => a.kind !== "music" || a.gain_db <= -22),
    "Keep music at -22dB or quieter.",
  );
  const score = checks.filter((c) => c.pass).length;
  const lengths = scenes.map((s) => s.duration);
  const warnings =
    lengths.length > 2 &&
    Math.max(...lengths) - Math.min(...lengths) <= Math.max(...lengths) * 0.1
      ? [
          "Scenes have nearly equal lengths; check the rhythm against the reference sheets.",
        ]
      : [];
  return {
    recipe: comp.recipeId,
    score,
    maximum: checks.length,
    ok: score >= 8 && checks.slice(0, 3).every((c) => c.pass),
    checks,
    warnings,
  };
}
