import { readFileSync } from "node:fs";
import { parseMotionMarkdown, parseTime, sourceParts } from "../core/parse.mjs";
import {
  patchFile,
  insertFile,
  saveSource,
  revisionOf,
} from "../core/patch.mjs";
import { assertValid } from "../core/validate.mjs";
import { parseDocument as parseYamlDocument } from "yaml";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const num = (v) => (typeof v === "number" ? v : Number(v));

const SESSION_OPS = [
  "describe",
  "seek",
  "select",
  "play",
  "pause",
  "workarea",
  "undo",
  "redo",
];
const DOCUMENT_OPS = [
  "set",
  "keyframe",
  "deleteKeyframe",
  "move",
  "trim",
  "reorder",
  "enable",
  "lock",
  "parent",
  "addLayer",
  "duplicate",
  "remove",
  "addScene",
  "setScene",
  "removeScene",
];
const SESSION_SET = new Set(SESSION_OPS);
const OP_NAMES = new Set([...SESSION_OPS, ...DOCUMENT_OPS]);

const PROP_TYPES = {
  text: "string",
  src: "string",
  role: "string",
  type: "string",
  x: "unit",
  y: "unit",
  w: "number",
  h: "number",
  rotation: "number",
  scale: "number",
  opacity: "number",
  anchorX: "number",
  anchorY: "number",
  fill: "string",
  color: "string",
  radius: "number",
  fit: "string",
  html: "string",
  enter: "string",
  exit: "string",
  parent: "string",
  enabled: "boolean",
  locked: "boolean",
  font_size: "number",
  font_weight: "number",
  blur: "number",
  z: "number",
  letter_spacing: "number",
  line_height: "number",
  max_width: "number",
  split: "string",
  stagger: "number",
  shape: "string",
};

const FILE_PROP = {
  text: "text",
  src: "src",
  role: "role",
  type: "type",
  x: "x",
  y: "y",
  w: "w",
  h: "h",
  rotation: "rotation",
  scale: "scale",
  opacity: "opacity",
  anchorX: "anchorX",
  anchorY: "anchorY",
  fill: "fill",
  color: "color",
  radius: "radius",
  fit: "fit",
  html: "html",
  enter: "enter",
  exit: "exit",
  font_size: "font_size",
  font_weight: "font_weight",
  blur: "blur",
  z: "z",
  letter_spacing: "letter_spacing",
  line_height: "line_height",
  max_width: "max_width",
  split: "split",
  stagger: "stagger",
  shape: "shape",
};

const DEFAULT_VALUE = {
  opacity: 1,
  scale: 1,
  rotation: 0,
  blur: 0,
  x: "50%",
  y: "50%",
};
const KEYFRAMEABLE = ["opacity", "x", "y", "scale", "rotation", "blur"];
function authorAnimate(el) {
  if (!el?.animate) return {};
  if (Array.isArray(el.animate))
    return Object.fromEntries(
      el.animate.map((t) => [
        t.prop,
        {
          from: t.from,
          to: t.to,
          start: t.start,
          duration: t.duration,
          easing: t.easing ?? "ease-out",
        },
      ]),
    );
  return { ...el.animate };
}

const sessions = new Map();
export function openSession(file) {
  const source = readFileSync(file, "utf8");
  const session = {
    file,
    source,
    revision: revisionOf(source),
    comp: parseMotionMarkdown(source),
    playhead: 0,
    selection: [],
    playing: false,
    workarea: null,
    locks: new Map(),
    history: [],
    future: [],
  };
  sessions.set(file, session);
  return session;
}
export function sessionFor(file) {
  let session = sessions.get(file);
  const source = readFileSync(file, "utf8");
  if (!session || session.revision !== revisionOf(source)) {
    session = openSession(file);
  }
  return session;
}

function locate(comp, layer, sceneId) {
  for (const scene of comp.scenes) {
    if (sceneId && scene.id !== sceneId) continue;
    for (let i = 0; i < scene.elements.length; i++) {
      const el = scene.elements[i];
      if (el.id === layer) return { scene, el, i, parent: null };
      if (el.type === "group") {
        const children = el.children || [];
        const j = children.findIndex((c) => c.id === layer);
        if (j >= 0) return { scene, el: children[j], i: j, parent: el };
      }
    }
  }
  return null;
}

function commit(session, result) {
  session.revision = result.revision;
  session.comp = result.composition;
  session.source = readFileSync(session.file, "utf8");
  return result;
}
function patch(session, patch) {
  const source = readFileSync(session.file, "utf8");
  return commit(
    session,
    patchFile(session.file, { ...patch, revision: revisionOf(source) }),
  );
}
function rewriteScene(session, sceneId, transform) {
  const source = readFileSync(session.file, "utf8");
  const parts = sourceParts(source);
  const block = parts.scenes.find((s) => s.id === sceneId);
  if (!block) throw new Error(`Scene '${sceneId}' not found.`);
  if (block.startRaw != null)
    throw new Error(
      "HTML scenes are edited as source. Property controls apply to structured scenes.",
    );
  const fence = block.body.match(/```motion\s*\r?\n([\s\S]*?)```/);
  const doc = parseYamlDocument(fence[1]);
  transform(doc);
  const local = block.body.replace(
    fence[0],
    "```motion\n" + doc.toString() + "```",
  );
  const updated =
    source.slice(0, block.bodyOffset) + local + source.slice(block.endOffset);
  assertValid(parseMotionMarkdown(updated));
  return commit(session, {
    revision: saveSource(session.file, updated, revisionOf(source)),
    composition: parseMotionMarkdown(updated),
  });
}
function writeAndCommit(session, updated) {
  const source = readFileSync(session.file, "utf8");
  assertValid(parseMotionMarkdown(updated));
  return commit(session, {
    revision: saveSource(session.file, updated, revisionOf(source)),
    composition: parseMotionMarkdown(updated),
  });
}

const sceneLocal = (scene, t, fps) =>
  clamp(parseTime(t, fps) - scene.start, 0, scene.duration);
const trimDuration = (scene, at, duration) =>
  clamp(duration, 0, Math.max(0, scene.duration - at));

function elementSourceNode(doc, sceneId, layer, parent) {
  const list = doc.get("elements");
  if (parent == null) {
    const i = list.items.findIndex(
      (e, j) => (e.get("id") || `${sceneId}-${j}`) === layer,
    );
    return i >= 0 ? { container: list.items, i, node: list.items[i] } : null;
  }
  const groupNode = list.items.find((g) => g.get("id") === parent.id);
  if (!groupNode) return null;
  const children = groupNode.get("children");
  const i = children.items.findIndex((c) => c.get("id") === layer);
  return i >= 0
    ? { container: children.items, i, node: children.items[i] }
    : null;
}

function apply(session, cmd) {
  if (cmd.op === "seek") {
    session.playhead = clamp(
      parseTime(cmd.t ?? 0, session.comp.fps),
      0,
      session.comp.duration,
    );
    return session.playhead;
  }
  if (cmd.op === "select") {
    session.selection = cmd.id == null ? [] : [String(cmd.id)];
    return session.selection;
  }
  if (cmd.op === "play") {
    session.playing = true;
    return true;
  }
  if (cmd.op === "pause") {
    session.playing = false;
    return false;
  }
  if (cmd.op === "workarea") {
    session.workarea =
      cmd.w == null
        ? null
        : {
            x: num(cmd.x ?? 0),
            y: num(cmd.y ?? 0),
            w: num(cmd.w),
            h: num(cmd.h),
          };
    return session.workarea;
  }

  if (cmd.op === "set") {
    const { prop, value } = cmd;
    if (!Object.hasOwn(PROP_TYPES, prop))
      throw new Error(
        `Unknown prop '${prop}'. Known props: ${Object.keys(PROP_TYPES).join(", ")}.`,
      );
    if (prop === "locked") {
      session.locks.set(cmd.layer, Boolean(value));
      return session.locks.get(cmd.layer);
    }
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    if (prop === "enabled") {
      patch(session, {
        scene: found.scene.id,
        element: found.el.id,
        set: { hidden: !Boolean(value) },
      });
      return Boolean(value);
    }
    if (prop === "parent") {
      return moveIntoParent(session, cmd);
    }
    const fileValue =
      PROP_TYPES[prop] === "number"
        ? num(value)
        : PROP_TYPES[prop] === "boolean"
          ? Boolean(value)
          : value;
    patch(session, {
      scene: found.scene.id,
      element: found.el.id,
      set: { [FILE_PROP[prop]]: fileValue },
    });
    return fileValue;
  }

  if (cmd.op === "keyframe") {
    const { prop, t, value } = cmd;
    if (!KEYFRAMEABLE.includes(prop))
      throw new Error(`Keyframeable props: ${KEYFRAMEABLE.join(", ")}.`);
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    const start = sceneLocal(found.scene, t, session.comp.fps);
    const duration = trimDuration(found.scene, start, num(cmd.duration ?? 0.6));
    const track = {
      from: found.el[prop] ?? DEFAULT_VALUE[prop],
      to: num(value),
      start,
      duration,
      easing: cmd.easing ?? "ease-out",
    };
    patch(session, {
      scene: found.scene.id,
      element: found.el.id,
      set: { animate: { ...authorAnimate(found.el), [prop]: track } },
    });
    return track;
  }

  if (cmd.op === "deleteKeyframe") {
    const { prop } = cmd;
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    const animate = authorAnimate(found.el);
    delete animate[prop];
    patch(session, {
      scene: found.scene.id,
      element: found.el.id,
      set: { animate },
    });
    return animate;
  }

  if (cmd.op === "move") {
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    const at = sceneLocal(found.scene, cmd.start, session.comp.fps);
    const set = { at };
    if (found.el.duration != null)
      set.duration = trimDuration(found.scene, at, found.el.duration);
    patch(session, { scene: found.scene.id, element: found.el.id, set });
    return at;
  }

  if (cmd.op === "trim") {
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    const duration = trimDuration(found.scene, found.el.at, num(cmd.duration));
    patch(session, {
      scene: found.scene.id,
      element: found.el.id,
      set: { duration },
    });
    return duration;
  }

  if (cmd.op === "enable") {
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    patch(session, {
      scene: found.scene.id,
      element: found.el.id,
      set: { hidden: false },
    });
    return true;
  }

  if (cmd.op === "lock") {
    session.locks.set(cmd.layer, true);
    return true;
  }

  if (cmd.op === "reorder") {
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    const total = found.parent?.children?.length ?? found.scene.elements.length;
    const target = clamp(num(cmd.index ?? 0), 0, Math.max(0, total - 1));
    const layer = cmd.layer;
    rewriteScene(session, found.scene.id, (doc) => {
      const hit = elementSourceNode(doc, found.scene.id, layer, found.parent);
      if (!hit) return;
      const [node] = hit.container.splice(hit.i, 1);
      hit.container.splice(target, 0, node);
    });
    return target;
  }

  if (cmd.op === "duplicate") {
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    let uid = `${cmd.layer}-copy`;
    while (locate(session.comp, uid)) uid += "-copy";
    rewriteScene(session, found.scene.id, (doc) => {
      const hit = elementSourceNode(
        doc,
        found.scene.id,
        cmd.layer,
        found.parent,
      );
      if (!hit) return;
      const clone = hit.node.clone();
      clone.set("id", uid);
      hit.container.splice(hit.i + 1, 0, clone);
    });
    return uid;
  }

  if (cmd.op === "remove") {
    const found = locate(session.comp, cmd.layer);
    if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
    const layer = cmd.layer;
    rewriteScene(session, found.scene.id, (doc) => {
      const hit = elementSourceNode(doc, found.scene.id, layer, found.parent);
      if (hit) hit.container.splice(hit.i, 1);
    });
    return true;
  }

  if (cmd.op === "parent") {
    return moveIntoParent(session, cmd);
  }

  if (cmd.op === "addLayer") {
    if (!cmd.scene) throw new Error("addLayer needs a scene.");
    if (cmd.id && !/^[\w-]+$/.test(cmd.id))
      throw new Error("Element ids use letters, digits, - or _.");
    const element = { ...cmd, id: cmd.id };
    for (const k of ["op", "file", "scene"]) delete element[k];
    return commit(
      session,
      insertFile(session.file, { scene: cmd.scene, element }),
    );
  }

  if (cmd.op === "addScene") {
    if (!cmd.id || !/^[\w-]+$/.test(cmd.id))
      throw new Error("addScene needs an id of letters, digits, - or _.");
    return commit(
      session,
      insertFile(session.file, {
        scene: {
          id: cmd.id,
          at: cmd.at,
          duration: cmd.duration,
          transition: cmd.transition,
          elements: cmd.elements,
        },
      }),
    );
  }

  if (cmd.op === "setScene") {
    const set = {};
    if (cmd.at != null) set.at = parseTime(cmd.at, session.comp.fps);
    if (cmd.duration != null)
      set.duration = parseTime(cmd.duration, session.comp.fps);
    if (cmd.transition != null) set.transition = cmd.transition;
    if (!Object.keys(set).length)
      throw new Error("setScene needs at, duration or transition.");
    return patch(session, { scene: cmd.scene, set });
  }

  if (cmd.op === "removeScene") {
    const parts = sourceParts(session.source);
    const block = parts.scenes.find((s) => s.id === cmd.scene);
    if (!block) throw new Error(`Scene '${cmd.scene}' not found.`);
    const updated =
      session.source.slice(0, block.offset) +
      session.source.slice(block.endOffset);
    return writeAndCommit(session, updated);
  }

  throw new Error(`Unknown op '${cmd.op}'.`);
}

function moveIntoParent(session, cmd) {
  const { parent } = cmd;
  if (parent != null && typeof parent !== "string")
    throw new Error("parent must be a group id or null.");
  const found = locate(session.comp, cmd.layer);
  if (!found) throw new Error(`Layer '${cmd.layer}' not found.`);
  const layer = cmd.layer;
  rewriteScene(session, found.scene.id, (doc) => {
    const root = doc.get("elements");
    if (!parent) {
      const hit = elementSourceNode(doc, found.scene.id, layer, found.parent);
      if (!hit) return;
      const [node] = hit.container.splice(hit.i, 1);
      root.items.push(node);
      return;
    }
    const groupNode = root.items.find((g) => g.get("id") === parent);
    if (!groupNode)
      throw new Error(
        `Group '${parent}' not found in scene '${found.scene.id}'.`,
      );
    const source = elementSourceNode(doc, found.scene.id, layer, found.parent);
    if (!source) return;
    const [node] = source.container.splice(source.i, 1);
    let children = groupNode.get("children");
    if (children?.items instanceof Array) children.items.push(node);
    else groupNode.set("children", [node]);
  });
  return parent ?? null;
}

export function runCommand(session, cmd) {
  if (!cmd || typeof cmd.op !== "string")
    throw new Error("runCommand needs {op: …}.");
  if (!OP_NAMES.has(cmd.op))
    throw new Error(
      `Unknown op '${cmd.op}'. Ops: ${[...OP_NAMES].join(", ")}.`,
    );
  if (cmd.op === "describe")
    return {
      op: "describe",
      ok: true,
      dirty: false,
      result: describe(session),
      state: describe(session),
    };
  if (cmd.op === "undo") return undo(session);
  if (cmd.op === "redo") return redo(session);

  const dirty = !SESSION_SET.has(cmd.op);
  const before = session.source;
  if (dirty) session.history.push(before);
  let result;
  try {
    result = apply(session, cmd);
  } catch (error) {
    if (dirty) session.history.pop();
    throw error;
  }
  if (dirty) session.future = [];
  return { op: cmd.op, ok: true, dirty, result, state: describe(session) };
}

function undo(session) {
  if (!session.history.length)
    return {
      op: "undo",
      ok: false,
      dirty: false,
      result: { restored: false, reason: "Nothing to undo." },
      state: describe(session),
    };
  const current = readFileSync(session.file, "utf8");
  session.future.push(current);
  const restored = session.history.pop();
  session.revision = saveSource(session.file, restored, revisionOf(current));
  session.comp = parseMotionMarkdown(restored);
  session.source = restored;
  return {
    op: "undo",
    ok: true,
    dirty: false,
    result: { restored: true },
    state: describe(session),
  };
}
function redo(session) {
  if (!session.future.length)
    return {
      op: "redo",
      ok: false,
      dirty: false,
      result: { restored: false, reason: "Nothing to redo." },
      state: describe(session),
    };
  const current = readFileSync(session.file, "utf8");
  session.history.push(current);
  const restored = session.future.pop();
  session.revision = saveSource(session.file, restored, revisionOf(current));
  session.comp = parseMotionMarkdown(restored);
  session.source = restored;
  return {
    op: "redo",
    ok: true,
    dirty: false,
    result: { restored: true },
    state: describe(session),
  };
}

export function runCommands(session, commands) {
  if (!Array.isArray(commands) || !commands.length)
    throw new Error("runCommands needs a non-empty commands array.");
  const results = [];
  let grouped = false;
  for (const cmd of commands) {
    if (!cmd || typeof cmd.op !== "string" || !OP_NAMES.has(cmd.op))
      throw new Error(
        `Unknown op '${cmd.op}'. Ops: ${[...OP_NAMES].join(", ")}.`,
      );
    if (cmd.op === "describe" || cmd.op === "undo" || cmd.op === "redo") {
      const r = runCommand(session, cmd);
      results.push({
        index: results.length,
        op: r.op,
        ok: r.ok,
        dirty: r.dirty,
        result: r.result,
      });
      continue;
    }
    if (SESSION_SET.has(cmd.op)) {
      results.push({
        index: results.length,
        op: cmd.op,
        ok: true,
        dirty: false,
        result: apply(session, cmd),
        state: describe(session),
      });
      continue;
    }
    if (!grouped) {
      session.history.push(session.source);
      grouped = true;
    }
    let result;
    try {
      result = apply(session, cmd);
    } catch (error) {
      if (grouped) session.history.pop();
      throw error;
    }
    session.future = [];
    results.push({
      index: results.length,
      op: cmd.op,
      ok: true,
      dirty: true,
      result,
      state: describe(session),
    });
  }
  return { results, grouped };
}

const round3 = (v) => Math.round(v * 1000) / 1000;

export function describe(session) {
  session.comp = session.comp || parseMotionMarkdown(session.source);
  return {
    file: session.file,
    width: session.comp.width,
    height: session.comp.height,
    fps: session.comp.fps,
    duration: round3(session.comp.duration),
    playhead: session.playhead,
    selection: session.selection,
    workarea: session.workarea,
    playing: session.playing,
    state: "saved",
    scenes: session.comp.scenes.map((s) => ({
      id: s.id,
      start: round3(s.start),
      duration: round3(s.duration),
      transition: s.transition?.type ?? "cut",
      elementCount: s.elements.length,
    })),
    layers: session.comp.scenes.flatMap((s) => {
      const flat = (els, parent) =>
        els.flatMap((el) => [
          {
            id: el.id,
            scene: s.id,
            parent: parent?.id ?? null,
            type: el.type ?? "text",
            role: el.role ?? null,
            start: round3(s.start + el.at),
            duration: round3(el.duration),
            x: el.x ?? "50%",
            y: el.y ?? "50%",
            w: el.w ?? null,
            h: el.h ?? null,
            opacity: el.opacity ?? 1,
            rotation: el.rotation ?? 0,
            scale: el.scale ?? 1,
            text: el.text ?? null,
            src: el.src ?? null,
            enabled: !el.hidden,
            locked: !!session.locks.get(el.id),
          },
          ...(el.type === "group" ? flat(el.children || [], el) : []),
        ]);
      return flat(s.elements, null);
    }),
  };
}

export const opSchema = {
  session: [
    {
      name: "describe",
      dirty: false,
      desc: "Return the current editor state.",
      args: [],
    },
    {
      name: "seek",
      dirty: false,
      desc: "Move the playhead to t seconds.",
      args: [["t", "number", true]],
    },
    {
      name: "select",
      dirty: false,
      desc: "Select a layer by id (or clear it).",
      args: [["id", "string", false]],
    },
    {
      name: "play",
      dirty: false,
      desc: "Mark the session as playing.",
      args: [],
    },
    {
      name: "pause",
      dirty: false,
      desc: "Mark the session as paused.",
      args: [],
    },
    {
      name: "workarea",
      dirty: false,
      desc: "Set the visible workarea (x, y, w, h).",
      args: [
        ["x", "number", false],
        ["y", "number", false],
        ["w", "number", false],
        ["h", "number", false],
      ],
    },
    {
      name: "undo",
      dirty: false,
      desc: "Undo the last document op (snapshot + write).",
      args: [],
    },
    {
      name: "redo",
      dirty: false,
      desc: "Redo the last undone document op.",
      args: [],
    },
  ],
  document: [
    {
      name: "set",
      dirty: true,
      desc: "Set a layer prop (text, x, y, opacity, rotation, scale, fill, role, …).",
      args: [
        ["layer", "string", true],
        ["prop", "string", true],
        ["value", "any", true],
      ],
    },
    {
      name: "keyframe",
      dirty: true,
      desc: "Add/update an animate: track for a layer at absolute time t.",
      args: [
        ["layer", "string", true],
        ["prop", "string", true],
        ["t", "number", true],
        ["value", "number", true],
        ["duration", "number", false],
        ["easing", "string", false],
      ],
    },
    {
      name: "deleteKeyframe",
      dirty: true,
      desc: "Remove an animate: track from a layer.",
      args: [
        ["layer", "string", true],
        ["prop", "string", true],
      ],
    },
    {
      name: "move",
      dirty: true,
      desc: "Move a layer so it starts at absolute time start.",
      args: [
        ["layer", "string", true],
        ["start", "number", true],
      ],
    },
    {
      name: "trim",
      dirty: true,
      desc: "Trim a layer to duration seconds.",
      args: [
        ["layer", "string", true],
        ["duration", "number", true],
      ],
    },
    {
      name: "reorder",
      dirty: true,
      desc: "Move a layer to index within its container.",
      args: [
        ["layer", "string", true],
        ["index", "number", true],
      ],
    },
    {
      name: "enable",
      dirty: true,
      desc: "Show a layer.",
      args: [["layer", "string", true]],
    },
    {
      name: "lock",
      dirty: true,
      desc: "Lock a layer in the editor (session-scoped).",
      args: [["layer", "string", true]],
    },
    {
      name: "parent",
      dirty: true,
      desc: "Move a layer into a group (or lift to the scene with null).",
      args: [
        ["layer", "string", true],
        ["parent", "string|null", true],
      ],
    },
    {
      name: "addLayer",
      dirty: true,
      desc: "Append an element to a scene.",
      args: [
        ["scene", "string", true],
        ["id", "string", true],
        ["type", "string", false],
        ["text", "string", false],
        ["x", "unit", false],
        ["y", "unit", false],
        ["opacity", "number", false],
      ],
    },
    {
      name: "duplicate",
      dirty: true,
      desc: "Duplicate a layer with a fresh id.",
      args: [["layer", "string", true]],
    },
    {
      name: "remove",
      dirty: true,
      desc: "Delete a layer.",
      args: [["layer", "string", true]],
    },
    {
      name: "addScene",
      dirty: true,
      desc: "Append a scene (extends project duration if needed).",
      args: [
        ["id", "string", true],
        ["at", "number|string", false],
        ["duration", "number|string", false],
        ["transition", "string", false],
        ["elements", "array", false],
      ],
    },
    {
      name: "setScene",
      dirty: true,
      desc: "Update a scene at/duration/transition.",
      args: [
        ["scene", "string", true],
        ["at", "number|string", false],
        ["duration", "number|string", false],
        ["transition", "string", false],
      ],
    },
    {
      name: "removeScene",
      dirty: true,
      desc: "Delete a scene block from the file.",
      args: [["scene", "string", true]],
    },
  ],
  props: Object.fromEntries(
    Object.entries(PROP_TYPES).map(([prop, type]) => [
      prop,
      {
        type,
        note:
          prop === "enabled"
            ? "persists as `hidden` in motion.md"
            : prop === "locked"
              ? "editor session state"
              : `maps to element \`${FILE_PROP[prop] ?? prop}\``,
      },
    ]),
  ),
  examples: [
    { op: "seek", t: 0 },
    { op: "set", layer: "title", prop: "text", value: "New headline" },
    { op: "set", layer: "title", prop: "x", value: 960 },
    { op: "set", layer: "badge", prop: "opacity", value: 1 },
    { op: "move", layer: "badge", start: 1.2 },
    {
      op: "keyframe",
      layer: "badge",
      prop: "opacity",
      t: 0.8,
      value: 1,
      duration: 0.4,
    },
    { op: "workarea", x: 0, y: 0, w: 1920, h: 1080 },
    { op: "undo" },
  ],
};
