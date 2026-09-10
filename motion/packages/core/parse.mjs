const ASPECTS = {
  "16:9": [1920, 1080],
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "21:9": [2560, 1080],
};

export function parseTime(value, fps = 30) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  const m = raw.match(/^(-?[\d.]+)\s*(ms|s|f)?$/i);
  if (!m) throw new Error(`Cannot parse time: ${value}`);
  const n = Number(m[1]);
  const unit = (m[2] || "s").toLowerCase();
  if (unit === "ms") return n / 1000;
  if (unit === "f") return n / fps;
  return n;
}

export function parseMotionShorthand(value) {
  if (!value || value === "none") return null;
  if (typeof value === "object") {
    return {
      preset: value.preset || "fade",
      duration: parseTime(value.duration ?? 0.4),
      delay: parseTime(value.delay ?? 0),
      easing: value.easing || "ease-out",
    };
  }
  const parts = String(value).trim().split(/\s+/);
  const [preset, duration = "0.4", delay = "0", easing = "ease-out"] = parts;
  return {
    preset,
    duration: parseTime(duration),
    delay: parseTime(delay),
    easing,
  };
}

function parseSimpleYaml(text) {
  const rawLines = text.replace(/\t/g, "  ").split(/\r?\n/);
  const items = [];
  for (const raw of rawLines) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    items.push({ indent: raw.match(/^ */)[0].length, line: raw.trim() });
  }

  function parseBlock(start, minIndent) {
    const map = {};
    const list = [];
    let mode = null;
    let i = start;
    while (i < items.length) {
      const { indent, line } = items[i];
      if (indent < minIndent) break;
      if (mode === "map" && indent !== minIndent && !line.startsWith("- ")) break;
      if (mode === "list" && indent < minIndent) break;

      if (line.startsWith("- ")) {
        if (mode === "map") break;
        mode = "list";
        const rest = line.slice(2);
        const childIndent = indent + 2;
        if (rest.includes(":") && !rest.startsWith("{")) {
          const idx = rest.indexOf(":");
          const k = rest.slice(0, idx).trim();
          const v = rest.slice(idx + 1).trim();
          const obj = {};
          if (v && v !== "|" && v !== ">") obj[k] = coerce(v);
          else if (!v) obj[k] = null;
          i += 1;
          const [nested, next] = parseMapFields(obj, i, childIndent);
          list.push(nested);
          i = next;
          continue;
        }
        list.push(coerce(rest));
        i += 1;
        continue;
      }

      if (indent !== minIndent && mode === "list") break;
      mode = "map";
      const idx = line.indexOf(":");
      if (idx === -1) {
        i += 1;
        continue;
      }
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      i += 1;
      if (!value || value === "|" || value === ">") {
        if (i < items.length && items[i].indent > indent && items[i].line.startsWith("- ")) {
          const [child, next] = parseBlock(i, items[i].indent);
          map[key] = child;
          i = next;
        } else if (i < items.length && items[i].indent > indent) {
          const [child, next] = parseBlock(i, items[i].indent);
          map[key] = child;
          i = next;
        } else {
          map[key] = {};
        }
      } else {
        map[key] = coerce(value);
      }
    }
    return [mode === "list" ? list : map, i];
  }

  function parseMapFields(obj, start, minIndent) {
    let i = start;
    while (i < items.length) {
      const { indent, line } = items[i];
      if (indent < minIndent) break;
      if (line.startsWith("- ")) break;
      if (indent !== minIndent) break;
      const idx = line.indexOf(":");
      if (idx === -1) {
        i += 1;
        continue;
      }
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      i += 1;
      if (!value || value === "|" || value === ">") {
        if (i < items.length && items[i].indent > indent) {
          const [child, next] = parseBlock(i, items[i].indent);
          obj[key] = child;
          i = next;
        } else obj[key] = {};
      } else obj[key] = coerce(value);
    }
    return [obj, i];
  }

  const [value] = parseBlock(0, items[0]?.indent ?? 0);
  return value && typeof value === "object" ? value : {};
}

function coerce(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function parseFrontmatter(md) {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: md };
  return { meta: parseSimpleYaml(match[1]), body: md.slice(match[0].length) };
}

function parseScenes(body, fps) {
  const scenes = [];
  const re = /^##\s+scene:\s*([A-Za-z0-9_-]+)\s*$/gm;
  const hits = [...body.matchAll(re)];
  for (let i = 0; i < hits.length; i++) {
    const id = hits[i][1];
    const start = hits[i].index + hits[i][0].length;
    const end = i + 1 < hits.length ? hits[i + 1].index : body.length;
    const chunk = body.slice(start, end);
    const fence = chunk.match(/```motion\r?\n([\s\S]*?)```/);
    const data = fence ? parseSimpleYaml(fence[1]) : {};
    scenes.push({
      id,
      duration: parseTime(data.duration ?? 2, fps),
      at: data.at != null ? parseTime(data.at, fps) : null,
      transition: parseTransition(data.transition),
      elements: Array.isArray(data.elements) ? data.elements.map((el, idx) => normalizeElement(el, idx, fps)) : [],
    });
  }
  return scenes;
}

function parseTransition(value) {
  if (!value) return { type: "cut", duration: 0 };
  if (typeof value === "object") {
    return {
      type: value.type || "fade",
      duration: parseTime(value.duration ?? 0.24),
    };
  }
  const [type, duration = "0"] = String(value).split(/\s+/);
  return { type, duration: parseTime(duration) };
}

function normalizeElement(el, idx, fps) {
  if (!el || typeof el !== "object") {
    return { id: `el-${idx}`, type: "text", text: String(el ?? ""), at: 0, duration: null };
  }
  return {
    ...el,
    id: el.id || `el-${idx}`,
    type: el.type || "text",
    at: parseTime(el.at ?? 0, fps),
    duration: el.duration != null ? parseTime(el.duration, fps) : null,
    enter: parseMotionShorthand(el.enter),
    exit: parseMotionShorthand(el.exit),
    z: el.z ?? idx,
  };
}

export function resolveSize(meta) {
  if (meta.width && meta.height) return { width: Number(meta.width), height: Number(meta.height) };
  if (meta.resolution && /^\d+x\d+$/i.test(String(meta.resolution))) {
    const [w, h] = String(meta.resolution).toLowerCase().split("x").map(Number);
    return { width: w, height: h };
  }
  const aspect = String(meta.aspect || "16:9");
  if (ASPECTS[aspect]) return { width: ASPECTS[aspect][0], height: ASPECTS[aspect][1] };
  if (/^\d+x\d+$/i.test(aspect)) {
    const [w, h] = aspect.toLowerCase().split("x").map(Number);
    return { width: w, height: h };
  }
  return { width: 1920, height: 1080, unknownAspect: aspect };
}

export function parseMotionMarkdown(md) {
  const { meta, body } = parseFrontmatter(md);
  const fps = Number(meta.fps || 30);
  const size = resolveSize(meta);
  const scenes = parseScenes(body, fps);

  let cursor = 0;
  for (const scene of scenes) {
    scene.start = scene.at == null ? cursor : scene.at;
    cursor = scene.start + scene.duration;
    for (const el of scene.elements) {
      if (el.duration == null) el.duration = Math.max(0, scene.duration - el.at);
    }
  }

  const duration = meta.duration != null ? parseTime(meta.duration, fps) : cursor;

  return {
    id: meta.id || "composition",
    title: meta.title || meta.id || "Untitled",
    fps,
    duration,
    background: meta.background || "#000000",
    safe_area: Number(meta.safe_area ?? 64),
    theme: {
      accent: "#7C5CFF",
      text: "#F5F5F7",
      muted: "#A1A1AA",
      font_display: "Inter, ui-sans-serif, system-ui",
      font_body: "Inter, ui-sans-serif, system-ui",
      ...(meta.theme || {}),
    },
    audio: Array.isArray(meta.audio) ? meta.audio : [],
    assets: meta.assets && typeof meta.assets === "object" ? meta.assets : {},
    aspect: meta.aspect || `${size.width}:${size.height}`,
    width: size.width,
    height: size.height,
    scenes,
    rawMeta: meta,
  };
}
