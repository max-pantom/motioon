import { stringify } from "yaml";

/** Easing names the engine accepts. Attach one to every motion. */
export const ease = Object.freeze({
  linear: "linear",
  in: "ease-in",
  out: "ease-out",
  inOut: "ease-in-out",
  expoIn: "expo.in",
  expoOut: "expo.out",
  /** Spring overshoot/settle accent. Use once per film on purpose. */
  spring: (stiffness = 3, damping = 10) => `spring(${stiffness}, ${damping})`,
});

function preset(name, duration = 0.6, delay = 0, easing = ease.expoOut) {
  return { enter: { preset: name, duration, delay, easing } };
}

/** Entrance presets. Values are seconds; default motion is expo.out. */
export const enter = Object.freeze({
  fade: (d = 0.6, delay = 0) => preset("fade", d, delay),
  fadeUp: (d = 0.7, delay = 0) => preset("fade-up", d, delay),
  scaleFade: (d = 0.5, delay = 0) => preset("scale-fade", d, delay),
  rise: (d = 0.32, delay = 0) => ({
    enter: {
      preset: "rise",
      duration: d,
      delay,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  }),
  slideLeft: (d = 0.6, delay = 0) => preset("slide-left", d, delay),
  slideRight: (d = 0.6, delay = 0) => preset("slide-right", d, delay),
  pop: (d = 0.4, delay = 0) => preset("pop", d, delay),
  rotateIn: (d = 0.6, delay = 0) => preset("rotate-in", d, delay),
  wipeUp: (d = 0.7, delay = 0) => preset("wipe-up", d, delay),
  wipeLeft: (d = 0.7, delay = 0) => preset("wipe-left", d, delay),
  zoomOut: (d = 0.72, delay = 0) => preset("zoom-out", d, delay),
  blurIn: (d = 0.6, delay = 0) => preset("blur-in", d, delay),
  /** Typewriter reveal, char by char. Perfect for one big statement. */
  type: (d = 1.5, delay = 0) => preset("type", d, delay),
  /** Draw an SVG path/line stroke from nothing. One per film is tasteful. */
  draw: (d = 1.1, delay = 0) => preset("draw", d, delay),
  /** Mask reveal for scenes and elements. */
  reveal: (d = 0.7, delay = 0) => preset("reveal", d, delay),
});

/**
 * One animated property: {animate: { prop: {from, to, start, duration, easing} }}.
 * Merge into an element with the spread operator.
 */
export function tween(
  prop,
  from,
  to,
  { start = 0, duration = 0.6, easing = ease.expoOut } = {},
) {
  return { animate: { [prop]: { from, to, start, duration, easing } } };
}

/** Merge several tweens/counters/entrances into one element spec. */
export function tracks(first = {}, ...rest) {
  const step = (base = {}, next = {}) => {
    const out = structuredClone(base);
    for (const [key, value] of Object.entries(next)) {
      if (value == null) continue;
      if (out[key] && typeof value === "object" && !Array.isArray(value))
        out[key] = step(out[key], value);
      else out[key] = value;
    }
    return out;
  };
  return [first, ...rest].reduce(step, {});
}

/** Count-up number: {count: {to, prefix?, suffix?, from?, start?, duration?, easing?, decimals?, thousands?}}. */
export function countUp(
  to,
  {
    from = 0,
    start = 0,
    duration = 1.2,
    easing = ease.expoOut,
    prefix = "",
    suffix = "",
    decimals = 0,
    thousands = true,
  } = {},
) {
  return {
    count: {
      to,
      from,
      start,
      duration,
      easing,
      prefix,
      suffix,
      decimals,
      thousands,
    },
  };
}

/** Swap text at times: {replace: [{at, text}, …]}. */
export function swap(entries) {
  return { replace: entries };
}

/** Element builders. Default x/y place the element center. */
export function text(id, value, opts = {}) {
  return { id, type: "text", text: value, ...opts };
}
export function hero(id, value, opts = {}) {
  return text(id, value, { role: "hero", ...opts });
}
export function sub(id, value, opts = {}) {
  return text(id, value, { role: "sub", ...opts });
}
export function label(id, value, opts = {}) {
  return text(id, value, { role: "label", ...opts });
}
export function caption(id, value, opts = {}) {
  return { id, type: "caption", text: value, ...opts };
}
export function shape(id, shape = "rect", opts = {}) {
  return { id, type: "shape", shape, ...opts };
}
export function svgEl(id, markup, opts = {}) {
  return { id, type: "svg", svg: markup, ...opts };
}
export function group(id, children, opts = {}) {
  return { id, type: "group", children, ...opts };
}

/** Deterministic scene cursor actions. Set these in scene.cursor.actions. */
export const cursor = Object.freeze({
  moveTo: (to, { at = 0, duration = 0.4, easing = ease.expoOut } = {}) => ({
    type: "move",
    to,
    at,
    duration,
    easing,
  }),
  click: ({ at = 0, event, duration = 0.18 } = {}) => ({
    type: "click",
    at,
    duration,
    ...(event ? { event } : {}),
  }),
});

/** Keep each part as a separate editable layer inside one component group. */
export const component = Object.freeze({
  decompose: (id, parts, opts = {}) =>
    group(
      id,
      Array.isArray(parts)
        ? parts
        : Object.entries(parts).map(([partId, part]) => ({
            id: partId,
            ...part,
          })),
      opts,
    ),
  enter: (name = "fade", duration = 0.4, delay = 0) =>
    preset(name, duration, delay),
  transitionTo: (
    properties,
    { start = 0, duration = 0.4, easing = ease.expoOut } = {},
  ) => ({
    animate: Object.fromEntries(
      Object.entries(properties).map(([prop, [from, to]]) => [
        prop,
        { from, to, start, duration, easing },
      ]),
    ),
  }),
});

/** Seekable typing and replacement tracks for text layers. */
text.type = ({ cps = 12, from = 0, caret = true, caret_color } = {}) => ({
  typewriter: { cps, from, caret, ...(caret_color ? { caret_color } : {}) },
});
text.replace = swap;

export const number = Object.freeze({ count: countUp });
export const mask = Object.freeze({
  reveal: ({
    shape = "rect",
    from = 0,
    to = 100,
    at = 0,
    duration = 0.5,
    easing = ease.expoOut,
    on,
    origin,
  } = {}) => ({
    behaviors: [
      {
        type: "mask",
        shape,
        from,
        to,
        at,
        duration,
        easing,
        ...(on ? { on } : {}),
        ...(origin ? { origin } : {}),
      },
    ],
  }),
});

export function scene(
  id,
  { duration = 2, at, transition, elements = [], direction, ...rest } = {},
  _elements,
) {
  if (_elements !== undefined) elements = _elements;
  return { id, duration, at, transition, elements, direction, ...rest };
}

export function toMarkdown(film) {
  const head = {};
  for (const [k, v] of Object.entries(film)) {
    if (k === "scenes" || k === "direction") continue;
    if (typeof v === "function" || v == null) continue;
    head[k] = v;
  }
  const sceneIds = new Set();
  for (const [i, s] of film.scenes.entries()) {
    if (!s.id) throw new Error(`scene at index ${i} needs an id.`);
    if (sceneIds.has(s.id)) throw new Error(`duplicate scene id '${s.id}'.`);
    sceneIds.add(s.id);
  }
  const blocks = [];
  if (film.direction) blocks.push(`# Direction\n${film.direction}\n`);
  for (const s of film.scenes) {
    const {
      id: _id,
      duration,
      at,
      transition,
      elements,
      direction,
      ...rest
    } = s;
    const body = { duration, ...rest };
    if (at != null) body.at = at;
    if (transition != null) body.transition = transition;
    if (direction != null) body.direction = direction;
    if (elements.length) body.elements = elements;
    blocks.push(
      `## scene: ${s.id}\n\`\`\`motion\n${stringify(body, { lineWidth: 0 })}\`\`\`\n`,
    );
  }
  return `---\n${stringify(head, { lineWidth: 0 })}\n---${"\n\n"}${blocks.join("\n")}\n`;
}

export function film(opts = {}) {
  const projection = {
    title: opts.title ?? "Untitled",
    version: opts.version ?? 1,
    width: opts.width ?? 1920,
    height: opts.height ?? 1080,
    fps: opts.fps ?? 30,
    duration: opts.duration ?? 3,
    background: opts.background ?? "#FFFFFF",
    theme: opts.theme,
    brand: opts.brand,
    assets: opts.assets,
    audio: opts.audio,
    direction: opts.direction,
  };
  const f = {
    ...projection,
    scenes: [],
    scene(_id, _opts, _elements) {
      const obj =
        typeof _opts === "object" && _opts !== null
          ? { ..._opts }
          : { duration: _opts ?? 2 };
      if (_elements !== undefined) obj.elements = _elements;
      const s = scene(_id, obj);
      f.scenes.push(s);
      return s;
    },
    md() {
      return toMarkdown(f);
    },
  };
  return f;
}

export const motion = {
  film,
  scene,
  toMarkdown,
  text,
  hero,
  sub,
  label,
  caption,
  shape,
  svgEl,
  group,
  cursor,
  component,
  number,
  mask,
  tween,
  tracks,
  countUp,
  swap,
  enter,
  ease,
};
export default motion;
