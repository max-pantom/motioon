import {
  highlightSource,
  replaceSourceValue,
  shiftedPosition,
  sourceColors,
  sourceValueAt,
} from "./source-tools.js";

const $ = (id) => document.getElementById(id);
const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const palette = [
  ["#2d3922", "#b4df78"],
  ["#342d24", "#dfbd79"],
  ["#2d2b38", "#b8a4e4"],
  ["#3a2931", "#e29bb8"],
];
let project,
  comp,
  time = 0,
  playing = false,
  last = 0,
  sceneId,
  elementId,
  ready = false,
  dirty = false,
  undos = 0,
  redos = 0,
  lastBusSeek = 0,
  audio = [],
  saveBusy = false,
  noticeTimer,
  exportTimer,
  completedExportId,
  canvasMode = false;
function notify(message, error = false) {
  clearTimeout(noticeTimer);
  $("status").textContent = message;
  $("status").classList.toggle("error", error);
  if (!error)
    noticeTimer = setTimeout(() => ($("status").textContent = ""), 4000);
}
async function request(path, data) {
  const res = await fetch(
    path,
    data
      ? {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-motion-token": project.token,
          },
          body: JSON.stringify(data),
        }
      : {},
  );
  const value = await res.json();
  if (!res.ok) throw new Error(value.error || "Request failed.");
  return value;
}
function applyBus(value, { installResponse = true } = {}) {
  undos = value.undo ?? undos;
  redos = value.redo ?? redos;
  if (installResponse) install(value);
  else {
    $("undo").disabled = !undos;
    $("redo").disabled = !redos;
  }
  return value;
}
async function bus(command, options = {}) {
  return applyBus(await request("/api/op", { command }), options);
}
async function busBatch(commands, options = {}) {
  return applyBus(await request("/api/op", { commands }), options);
}
function busSeek(t) {
  const now = Date.now();
  if (now - lastBusSeek < 100) return;
  lastBusSeek = now;
  bus({ op: "seek", t }, { installResponse: false }).catch(() => {});
}
function currentScene() {
  return comp.scenes.find((s) => s.id === sceneId) || comp.scenes[0];
}
function currentElement() {
  return findLayer(currentScene()?.elements, elementId);
}
function findLayer(elements = [], id) {
  for (const element of elements) {
    if (element.id === id) return element;
    const child = findLayer(element.children, id);
    if (child) return child;
  }
  return null;
}
const title = (id) =>
  id.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase());
const seconds = (t) => `${Number(t.toFixed(2))}s`;
function stamp(t) {
  const min = Math.floor(t / 60),
    sec = Math.floor(t % 60),
    frame = Math.floor((t % 1) * comp.fps + 1e-5);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(frame).padStart(2, "0")}`;
}
function fit() {
  if (!comp) return;
  const r = $("canvas-area").getBoundingClientRect();
  const scale = Math.max(
    0.02,
    Math.min((r.width - 20) / comp.width, (r.height - 46) / comp.height, 1),
  );
  $("canvas-shell").style.width = comp.width * scale + "px";
  $("canvas-shell").style.height = comp.height * scale + "px";
  const frame = $("composition");
  frame.style.width = comp.width + "px";
  frame.style.height = comp.height + "px";
  frame.style.transform = `scale(${scale})`;
  $("zoom").textContent = Math.round(scale * 100) + "%";
}
function syncAudio(force = false) {
  for (const { node, track } of audio) {
    const timelineLocal = time - track.at,
      local = timelineLocal + track.trim,
      sourceRemaining = Number.isFinite(node.duration)
        ? Math.max(0, node.duration - track.trim)
        : null,
      cueDuration = track.duration ?? (track.oneshot ? sourceRemaining : null),
      active =
        timelineLocal >= 0 &&
        (cueDuration == null || timelineLocal < cueDuration);
    node.muted = !$("sound").checked;
    let gain = track.volume * 10 ** ((track.gain_db ?? 0) / 20);
    if (active && track.fade_in > 0)
      gain *= Math.min(1, timelineLocal / track.fade_in);
    if (
      active &&
      track.fade_out > 0 &&
      cueDuration != null &&
      timelineLocal > cueDuration - track.fade_out
    )
      gain *= Math.max(0, (cueDuration - timelineLocal) / track.fade_out);
    node.volume = Math.max(0, Math.min(1, gain));
    if (active) {
      if (force || Math.abs(node.currentTime - local) > 0.15) {
        try {
          node.currentTime = local;
        } catch {}
      }
      if (playing && node.paused) node.play().catch(() => {});
      if (!playing) node.pause();
    } else {
      node.pause();
      if (timelineLocal < 0 && node.currentTime !== track.trim) {
        try {
          node.currentTime = track.trim;
        } catch {}
      }
    }
  }
}
function setTime(value) {
  time = Math.max(
    0,
    Math.min((Math.ceil(comp.duration * comp.fps) - 1) / comp.fps, value),
  );
  $("composition").contentWindow.postMessage({ type: "seek", t: time }, "*");
  busSeek(time);
  $("timecode").textContent = stamp(time);
  $("scrubber").value = time;
  $("frame-counter").textContent =
    `Frame ${Math.round(time * comp.fps)} of ${Math.ceil(comp.duration * comp.fps)}`;
  const head = $("playhead");
  if (head) head.style.left = (time / comp.duration) * 100 + "%";
  syncAudio();
}
function setPlaying(value) {
  playing = value;
  last = performance.now();
  $("play").setAttribute("aria-label", value ? "Pause video" : "Play video");
  $("play").innerHTML = value
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm7 0h4v14h-4z" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z" fill="currentColor"/></svg>';
  lastBusSeek = 0;
  bus({ op: value ? "play" : "pause" }, { installResponse: false }).catch(
    () => {},
  );
  if (!value) busSeek(time);
  syncAudio(true);
}
function rebuildAudio() {
  for (const a of audio) {
    a.node.pause();
    a.node.src = "";
  }
  audio = comp.audio.map((track) => {
    const src = track.src.replace(
      /^asset:(?:\/\/)?([\w.-]+)$/,
      (_, id) => comp.assets[id],
    );
    const node = new Audio(src);
    node.preload = "auto";
    node.addEventListener("loadedmetadata", () => syncAudio(true));
    return { track, node };
  });
}
function install(value, { reload = true } = {}) {
  const token = value.token || project?.token;
  project = { ...value, token };
  comp = project.composition;
  window.motioonComposition = comp;
  window.dispatchEvent(
    new CustomEvent("motioon:composition", { detail: comp }),
  );
  sceneId = comp.scenes.some((s) => s.id === sceneId)
    ? sceneId
    : comp.scenes[0]?.id;
  if (!currentElement()) elementId = null;
  $("project-title").textContent = comp.title;
  document.title = `${comp.title} · Motioon`;
  $("dimensions").textContent = `${comp.width} × ${comp.height}`;
  $("total-time").textContent = "/ " + stamp(comp.duration);
  $("scene-count").textContent = `${comp.scenes.length} scenes`;
  $("timeline-duration").textContent =
    `${seconds(comp.duration)} · ${comp.fps} fps`;
  $("scrubber").max = Math.max(
    0,
    (Math.ceil(comp.duration * comp.fps) - 1) / comp.fps,
  );
  $("scrubber").step = 1 / comp.fps;
  $("save-state").textContent = "All changes saved";
  $("undo").disabled = !undos;
  $("redo").disabled = !redos;
  dirty = false;
  renderLists();
  renderProperties();
  renderTimeline();
  rebuildAudio();
  if (reload) {
    ready = false;
    $("composition").src = "/composition.html?v=" + project.revision;
  }
  fit();
  setTime(time);
}
function select(scene, element = null, seek = true) {
  if (dirty) {
    notify("Save or discard your adjustments before changing selection.", true);
    return;
  }
  sceneId = scene;
  elementId = element;
  renderLists();
  renderProperties();
  renderTimeline();
  $("scene-title").textContent = title(currentScene().id);
  if (seek) {
    setPlaying(false);
    const s = currentScene(),
      e = currentElement();
    setTime(
      s.start + (e ? e.at : 0) + Math.min(0.5, (e?.duration ?? s.duration) / 2),
    );
  } else setTime(time);
  $("composition").contentWindow.postMessage(
    { type: "select", id: elementId },
    "*",
  );
  bus({ op: "select", id: elementId }, { installResponse: false }).catch(
    () => {},
  );
}
function renderLists() {
  const layerButtons = (elements, depth = 0) =>
    elements
      .map(
        (e) =>
          `<button class="layer ${e.id === elementId ? "selected" : ""}" style="--depth:${depth}" data-element="${esc(e.id)}" aria-pressed="${e.id === elementId}"><span class="layer-icon" aria-hidden="true">${e.type === "text" ? "T" : e.type === "image" ? "▧" : e.type === "shape" ? "◇" : "⌘"}</span><span>${esc(e.text || title(e.id))}</span></button>${e.children?.length ? layerButtons(e.children, depth + 1) : ""}`,
      )
      .join("");
  $("scene-title").textContent = title(currentScene().id);
  $("scene-list").innerHTML = comp.scenes
    .map((s, i) => {
      const [tint, ink] = palette[i % palette.length];
      return `<div class="scene-card" style="--tint:${tint};--ink:${ink}"><button class="scene-row ${s.id === sceneId ? "selected" : ""}" data-scene="${esc(s.id)}" aria-pressed="${s.id === sceneId}"><span class="scene-number">${String(i + 1).padStart(2, "0")}</span><span><strong>${esc(title(s.id))}</strong><small>${seconds(s.start)} – ${seconds(s.start + s.duration)}</small></span><span class="chevron" aria-hidden="true">${s.id === sceneId ? "⌄" : "›"}</span></button>${s.id === sceneId ? `<div class="layer-list">${layerButtons(s.elements) || '<p class="empty">HTML scene · edit in source</p>'}</div>` : ""}</div>`;
    })
    .join("");
  $("scene-list")
    .querySelectorAll("[data-scene]")
    .forEach((b) => (b.onclick = () => select(b.dataset.scene)));
  $("scene-list")
    .querySelectorAll("[data-element]")
    .forEach((b) => (b.onclick = () => select(sceneId, b.dataset.element)));
  $("asset-list").innerHTML =
    comp.assetInfo
      .map(
        (a) =>
          `<div class="asset-row">${/\.(svg|png|jpe?g|webp|gif)$/i.test(a.src) ? `<img src="${esc(a.src)}" alt="${esc(a.id)}">` : '<span aria-hidden="true">♫</span>'}<div><strong>${esc(a.id)}</strong><small>${esc(a.src)}</small></div></div>`,
      )
      .join("") ||
    '<p class="empty">No assets yet. Add local files and declare them in motion.md.</p>';
}
const field = (label, name, value, type = "text", extra = "") =>
  `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(value ?? "")}" ${extra}></label>`;
function renderProperties() {
  const s = currentScene(),
    e = currentElement();
  $("selection-title").textContent = e ? title(e.id) : title(s.id);
  $("selection-type").textContent = e
    ? `${title(e.type)} layer`
    : `${s.format === "html" ? "HTML" : "Structured"} scene · ${seconds(s.duration)}`;
  let html = "";
  if (s.format === "html") {
    html =
      '<p class="empty">This scene is authored in HTML. Open the source editor to change its content and timing.</p><button type="button" class="secondary" id="html-edit">Edit source</button>';
  } else if (e) {
    html = `<fieldset class="property-section"><legend>Content</legend>${["text", "caption"].includes(e.type) ? `<label class="field">Text<textarea name="text">${esc(e.text)}</textarea></label><div class="field-row">${field("Size", "font_size", e.font_size ?? (e.role === "hero" ? 72 : e.role === "sub" ? 28 : e.role === "label" ? 16 : 22), "number", 'min="1" step="1"')}${field("Color", "color", e.color || (e.role === "sub" ? comp.theme.muted : e.role === "label" ? comp.theme.accent : comp.theme.text), "color")}</div><div class="field-row"><label class="field">Animate by<select name="split"><option value="">Whole layer</option>${["words", "chars", "lines"].map((p) => `<option ${p === e.split ? "selected" : ""}>${p}</option>`).join("")}</select></label>${field("Stagger (s)", "stagger", e.stagger ?? 0.045, "number", 'min="0" step="0.005"')}</div>` : e.type === "shape" ? field("Fill", "fill", e.fill || "#ffffff", "color") : e.type === "image" ? field("Source", "src", e.src) : '<p class="empty">HTML content is editable in source.</p>'}</fieldset><fieldset class="property-section"><legend>Transform</legend><div class="field-row">${field("Position X", "x", e.x ?? "50%")}${field("Position Y", "y", e.y ?? "50%")}</div><div class="field-row">${field("Width", "w", e.w ?? "")}${field("Height", "h", e.h ?? "")}</div><div class="field-row">${field("Scale", "scale", e.scale ?? 1, "number", 'min="0" step="0.05"')}${field("Rotation", "rotation", e.rotation ?? 0, "number", 'step="1"')}</div><div class="field-row">${field("Opacity", "opacity", e.opacity ?? 1, "number", 'min="0" max="1" step="0.05"')}<label class="field">Visible<input name="visible" type="checkbox" ${e.hidden ? "" : "checked"}></label></div></fieldset><fieldset class="property-section"><legend>Timing</legend><div class="field-row">${field("Start in scene (s)", "at", e.at, "number", 'min="0" step="0.01"')}${field("Duration (s)", "duration", e.duration, "number", 'min="0.01" step="0.01"')}</div><label class="field">Entrance<select name="enter_preset">${["none", "fade", "fade-up", "fade-down", "scale-fade", "blur-in", "wipe-left", "wipe-up", "slide-left", "slide-right", "pop", "zoom-out", "rotate-in"].map((p) => `<option ${p === (e.enter?.preset || "none") ? "selected" : ""}>${p}</option>`).join("")}</select></label><label class="field">Easing<select name="enter_easing">${["ease-out", "ease-in", "ease-in-out", "linear", "expo.out"].map((p) => `<option ${p === (e.enter?.easing || "ease-out") ? "selected" : ""}>${p}</option>`).join("")}</select></label><div class="field-row">${field("Enter duration (s)", "enter_duration", e.enter?.duration ?? 0.4, "number", 'min="0" step="0.01"')}${field("Enter delay (s)", "enter_delay", e.enter?.delay ?? 0, "number", 'min="0" step="0.01"')}</div></fieldset>`;
  } else
    html = `<fieldset class="property-section"><legend>Scene timing</legend><div class="field-row">${field("Start (s)", "at", s.start, "number", 'min="0" step="0.01"')}${field("Duration (s)", "duration", s.duration, "number", 'min="0.01" step="0.01"')}</div><p class="empty">Scene duration must include all its layers. Use the source editor for changes across several scenes.</p></fieldset>`;
  $("properties").innerHTML =
    html +
    (s.format === "motion"
      ? '<p id="property-error" class="inline-error" role="alert"></p><button type="submit" class="primary properties-save">Save adjustments</button><button type="button" class="quiet properties-save" id="discard">Discard adjustments</button>'
      : "");
  $("properties").oninput = () => {
    dirty = true;
    $("save-state").textContent = "Unsaved adjustments";
  };
  $("properties").onsubmit = saveProperties;
  if ($("discard"))
    $("discard").onclick = () => {
      dirty = false;
      renderProperties();
      $("save-state").textContent = "All changes saved";
      notify("Unsaved adjustments discarded");
    };
  if ($("html-edit")) $("html-edit").onclick = openSource;
}
async function saveProperties(event) {
  event.preventDefault();
  if (saveBusy) return;
  const form = event.currentTarget,
    e = currentElement(),
    values = new FormData(form),
    commands = [];
  const num = (k) => {
    const v = values.get(k);
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const set = (layer, prop, value) => {
    if (value !== null && value !== undefined)
      commands.push({ op: "set", layer, prop, value });
  };
  if (!e) {
    const s = currentScene();
    const at = num("at");
    const duration = num("duration");
    if (at != null)
      commands.push({ op: "setScene", scene: s.id, at: Number(at.toFixed(3)) });
    if (duration != null && duration > 0)
      commands.push({
        op: "setScene",
        scene: s.id,
        duration: Number(duration.toFixed(3)),
      });
  } else {
    const id = e.id;
    if (["text", "caption"].includes(e.type)) {
      set(id, "text", values.get("text"));
      set(id, "font_size", num("font_size"));
      set(id, "color", values.get("color") || null);
      const split = values.get("split");
      set(id, "split", split === "" ? null : split);
      set(id, "stagger", num("stagger"));
    } else if (e.type === "shape") {
      set(id, "fill", values.get("fill") || null);
    } else if (e.type === "image") {
      set(id, "src", values.get("src") || null);
    }
    set(id, "x", values.get("x"));
    set(id, "y", values.get("y"));
    const w = num("w"),
      h = num("h");
    if (w != null) set(id, "w", w);
    if (h != null) set(id, "h", h);
    set(id, "scale", num("scale"));
    set(id, "rotation", num("rotation"));
    set(id, "opacity", num("opacity"));
    set(id, "enabled", values.has("visible"));
    const at = num("at");
    if (at != null)
      commands.push({
        op: "move",
        layer: id,
        start: Number((currentScene().start + at).toFixed(3)),
      });
    const duration = num("duration");
    if (duration != null && duration > 0)
      commands.push({
        op: "trim",
        layer: id,
        duration: Number(duration.toFixed(3)),
      });
    const preset = values.get("enter_preset");
    if (preset)
      commands.push({
        op: "set",
        layer: id,
        prop: "enter",
        value:
          preset === "none"
            ? null
            : {
                preset,
                duration: Number(values.get("enter_duration")),
                delay: Number(values.get("enter_delay")),
                easing: values.get("enter_easing") || "ease-out",
              },
      });
  }
  const button = form.querySelector("[type=submit]");
  button.disabled = true;
  saveBusy = true;
  try {
    await busBatch(commands);
    notify("Adjustments saved");
  } catch (error) {
    $("property-error").textContent = error.message;
    notify(error.message, true);
  } finally {
    saveBusy = false;
    button.disabled = false;
  }
}
async function mutate(path, payload) {
  await request(path, payload);
  install(await request("/api/project"));
}
function renderTimeline() {
  const marks = Array.from(
    { length: 9 },
    (_, i) =>
      `<span class="tick" style="left:${(i / 8) * 100}%">${seconds((comp.duration * i) / 8)}</span>`,
  ).join("");
  $("timeline").innerHTML =
    `<div class="timeline-ruler">${marks}</div><div class="timeline-tracks">${comp.scenes
      .map((s, i) => {
        const [tint, ink] = palette[i % palette.length];
        return `<div class="track" style="--tint:${tint};--ink:${ink}"><span class="track-label"><span class="track-dot"></span>${esc(title(s.id))}</span><div class="track-lane" data-lane="${esc(s.id)}"><button class="clip ${s.id === sceneId ? "selected" : ""}" data-clip="${esc(s.id)}" style="left:${(s.start / comp.duration) * 100}%;width:${(s.duration / comp.duration) * 100}%" aria-label="${esc(title(s.id))}, ${seconds(s.start)} to ${seconds(s.start + s.duration)}">${esc(title(s.id))}<small>${seconds(s.duration)}</small></button></div></div>`;
      })
      .join(
        "",
      )}<div class="timeline-head-wrap"><div class="playhead" id="playhead"></div></div></div>`;
  $("timeline")
    .querySelectorAll("[data-clip]")
    .forEach((button) => {
      button.onclick = () => select(button.dataset.clip);
    });
  $("timeline")
    .querySelectorAll(".track-lane")
    .forEach((lane) =>
      lane.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) return;
        setPlaying(false);
        lane.setPointerCapture(event.pointerId);
        const scrub = (e) => {
          const r = lane.getBoundingClientRect();
          setTime(
            Math.round(
              ((e.clientX - r.left) / r.width) * comp.duration * comp.fps,
            ) / comp.fps,
          );
        };
        scrub(event);
        const end = () => {
          lane.removeEventListener("pointermove", scrub);
          lane.removeEventListener("pointerup", end);
          lane.removeEventListener("pointercancel", end);
        };
        lane.addEventListener("pointermove", scrub);
        lane.addEventListener("pointerup", end);
        lane.addEventListener("pointercancel", end);
      }),
    );
}
function syncSourceHighlight() {
  const input = $("source-text");
  $("source-highlight").innerHTML = highlightSource(input.value);
  $("source-highlight").scrollTop = input.scrollTop;
  $("source-highlight").scrollLeft = input.scrollLeft;
  $("source-colors").innerHTML =
    sourceColors(input.value)
      .map(
        (color) =>
          `<button type="button" class="source-color" data-color="${color}" title="Edit ${color}"><span style="background:${color}"></span>${color}</button>`,
      )
      .join("") || '<p class="muted">No hex colors in this source.</p>';
}
function inspectSource() {
  const input = $("source-text");
  const item = sourceValueAt(input.value, input.selectionStart);
  const target = $("source-property");
  if (!item) {
    target.innerHTML = "";
    $("source-hint").textContent =
      "Tap a property in the source to inspect and change it.";
    return;
  }
  $("source-hint").textContent = `Line ${item.line} · ${item.key}`;
  const color = item.color;
  const editable = color || item;
  const value = color?.value || item.value;
  const fullHex =
    color && color.value.length === 4
      ? `#${[...color.value.slice(1)].map((digit) => digit + digit).join("")}`
      : color?.value;
  target.innerHTML = `<label class="field">Value<input id="source-value" type="text" value="${esc(value)}" aria-label="${esc(item.key)} value"></label>${color ? `<label class="field">Color<input id="source-color-input" type="color" value="${fullHex}"></label>` : ""}<button type="button" id="source-apply" class="secondary">Apply value</button><p class="source-detail">${esc(item.key)} · ${editable.start + 1}–${editable.end}</p>`;
  const apply = (next) => {
    const value = String(next);
    input.value = replaceSourceValue(input.value, editable, value);
    input.focus();
    input.setSelectionRange(editable.start, editable.start + value.length);
    syncSourceHighlight();
    inspectSource();
  };
  $("source-apply").onclick = () => apply($("source-value").value);
  $("source-value").onkeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      apply(event.currentTarget.value);
    }
  };
  if (color)
    $("source-color-input").onchange = (event) => apply(event.target.value);
}
$("source-text").addEventListener("input", () => {
  syncSourceHighlight();
  inspectSource();
});
$("source-text").addEventListener("click", inspectSource);
$("source-text").addEventListener("keyup", inspectSource);
$("source-text").addEventListener("scroll", () => {
  $("source-highlight").scrollTop = $("source-text").scrollTop;
  $("source-highlight").scrollLeft = $("source-text").scrollLeft;
});
$("source-colors").onclick = (event) => {
  const chip = event.target.closest("[data-color]");
  if (!chip) return;
  const input = $("source-text");
  const index = input.value.toUpperCase().indexOf(chip.dataset.color);
  if (index < 0) return;
  input.focus();
  input.setSelectionRange(index, index + chip.dataset.color.length);
  inspectSource();
};
function openSource() {
  if (dirty) {
    notify("Save or discard your adjustments before editing source.", true);
    return;
  }
  setPlaying(false);
  $("source-text").value = project.source;
  $("source-error").textContent = "";
  syncSourceHighlight();
  inspectSource();
  $("source-dialog").showModal();
}
$("source-open").onclick = openSource;
$("source-save").onclick = async () => {
  const b = $("source-save");
  b.disabled = true;
  try {
    await mutate("/api/source", {
      source: $("source-text").value,
      revision: project.revision,
    });
    $("source-dialog").close();
    notify("Source saved");
  } catch (e) {
    $("source-error").textContent = e.message;
  } finally {
    b.disabled = false;
  }
};
$("undo").onclick = async () => {
  if (saveBusy) return;
  if (dirty) {
    notify("Save or discard your adjustments before undoing an edit.", true);
    return;
  }
  saveBusy = true;
  try {
    await bus({ op: "undo" });
    notify("Edit undone");
  } catch (e) {
    notify(e.message, true);
  } finally {
    saveBusy = false;
  }
};
$("redo").onclick = async () => {
  if (saveBusy) return;
  if (dirty) {
    notify("Save or discard your adjustments before redoing an edit.", true);
    return;
  }
  saveBusy = true;
  try {
    await bus({ op: "redo" });
    notify("Edit restored");
  } catch (e) {
    notify(e.message, true);
  } finally {
    saveBusy = false;
  }
};
const Motion = globalThis.Motion;
const RING = 2 * Math.PI * 42;
const setProgress = (value) => {
  const v = Math.max(0, Math.min(1, value));
  const ring = $("export-progress");
  const arc = $("export-arc");
  const pct = $("export-percent");
  if (ring) ring.setAttribute("aria-valuenow", Math.round(v * 100));
  if (arc) {
    const target = RING * (1 - v);
    if (Motion?.animate) {
      const anim = Motion.animate(
        arc,
        { strokeDashoffset: target },
        { duration: 0.35, ease: "easeOut" },
      );
      if (v >= 1 || v <= 0) anim.complete();
    } else arc.style.strokeDashoffset = target;
  }
  if (pct) pct.textContent = Math.round(v * 100);
};
$("export-open").onclick = () => {
  if (dirty) {
    notify("Save or discard your adjustments before exporting.", true);
    return;
  }
  setPlaying(false);
  $("export-resolution").textContent =
    `${comp.width} × ${comp.height} · ${comp.fps} fps`;
  $("export-duration").textContent =
    `${seconds(comp.duration)} · ${Math.ceil(comp.duration * comp.fps)} frames`;
  $("export-dialog").showModal();
};
function showExportDownloads() {
  const choice = $("export-audio").value;
  $("download").hidden = !completedExportId || choice === "without";
  $("download-silent").hidden = !completedExportId || choice === "with";
}
$("export-audio").onchange = showExportDownloads;
$("render").onclick = async () => {
  const button = $("render");
  button.disabled = true;
  completedExportId = null;
  showExportDownloads();
  setProgress(0);
  $("export-progress").hidden = false;
  $("export-status").textContent = "Preparing your video…";
  try {
    const job = await request("/api/render", {
      format: $("export-format").value,
      quality: $("export-quality").value,
    });
    const poll = async () => {
      try {
        const value = await request("/api/render/" + job.id);
        setProgress(value.progress);
        $("export-status").textContent =
          `Rendering · ${Math.round(value.progress * 100)}%`;
        if (value.status === "failed") throw new Error(value.error);
        if (value.status === "complete") {
          $("export-status").textContent =
            `Ready. ${value.result.frames} frames rendered in ${value.result.seconds}s.`;
          $("download").href = "/download/" + job.id;
          $("download-silent").href = "/download/" + job.id + "/silent";
          completedExportId = job.id;
          showExportDownloads();
          if (Motion?.animate) {
            const dl = $("download").hidden
              ? $("download-silent")
              : $("download");
            Motion.animate(
              dl,
              { opacity: [0, 1], scale: [0.92, 1.06, 1] },
              { duration: 0.55, ease: Motion.anticipate },
            );
          }
          button.disabled = false;
        } else exportTimer = setTimeout(poll, 700);
      } catch (e) {
        $("export-status").textContent = e.message;
        button.disabled = false;
      }
    };
    await poll();
  } catch (e) {
    $("export-status").textContent = e.message;
    button.disabled = false;
  }
};
$("scenes-tab").onclick = () => {
  $("scene-list").hidden = false;
  $("asset-list").hidden = true;
  $("scenes-tab").setAttribute("aria-pressed", "true");
  $("assets-tab").setAttribute("aria-pressed", "false");
};
$("assets-tab").onclick = () => {
  $("scene-list").hidden = true;
  $("asset-list").hidden = false;
  $("assets-tab").setAttribute("aria-pressed", "true");
  $("scenes-tab").setAttribute("aria-pressed", "false");
};
$("play").onclick = () => {
  if (time >= (Math.ceil(comp.duration * comp.fps) - 1) / comp.fps) setTime(0);
  setPlaying(!playing);
};
$("previous-frame").onclick = () => {
  setPlaying(false);
  setTime(time - 1 / comp.fps);
};
$("next-frame").onclick = () => {
  setPlaying(false);
  setTime(time + 1 / comp.fps);
};
$("scrubber").oninput = () => {
  setPlaying(false);
  setTime(Number($("scrubber").value));
};
$("sound").onchange = () => syncAudio(true);
$("fit-button").onclick = fit;
$("canvas-mode").onclick = () => {
  canvasMode = !canvasMode;
  $("canvas-mode").setAttribute("aria-pressed", String(canvasMode));
  $("composition").contentWindow.postMessage(
    { type: "motion:edit-mode", enabled: canvasMode },
    "*",
  );
  notify(
    canvasMode
      ? "Drag a layer on the canvas to move it. Changes save to motion.md."
      : "Canvas move is off.",
  );
};
async function moveCanvasLayer(id, dx, dy) {
  if (!canvasMode || saveBusy || dirty) {
    notify("Save pending adjustments before moving a layer.", true);
    return;
  }
  const scene = comp.scenes.find((s) => findLayer(s.elements, id));
  const layer = scene && findLayer(scene.elements, id);
  if (!layer || scene.format !== "motion") return;
  const x = shiftedPosition(layer.x, dx, comp.width);
  const y = shiftedPosition(layer.y, dy, comp.height);
  if (x == null || y == null) {
    notify(
      "This layer uses a position expression. Edit its position in source.",
      true,
    );
    return;
  }
  saveBusy = true;
  try {
    await busBatch([
      { op: "set", layer: id, prop: "x", value: x },
      { op: "set", layer: id, prop: "y", value: y },
    ]);
    sceneId = scene.id;
    elementId = id;
    renderLists();
    renderProperties();
    notify(`${title(id)} moved and saved.`);
  } catch (error) {
    notify(error.message, true);
  } finally {
    saveBusy = false;
  }
}
window.addEventListener("message", (event) => {
  if (event.source !== $("composition").contentWindow) return;
  if (event.data?.type === "motion:ready") {
    ready = true;
    setTime(time);
    $("composition").contentWindow.postMessage(
      { type: "motion:edit-mode", enabled: canvasMode },
      "*",
    );
    $("composition").contentWindow.postMessage(
      { type: "select", id: elementId },
      "*",
    );
  }
  if (event.data?.type === "motion:error") notify(event.data.message, true);
  if (event.data?.type === "motion:drag") {
    moveCanvasLayer(event.data.id, event.data.dx, event.data.dy);
    return;
  }
  const inbound =
    event.data?.type === "select" || event.data?.type === "motion:select";
  if (inbound) {
    for (const s of comp.scenes)
      if (findLayer(s.elements, event.data.id))
        select(s.id, event.data.id, false);
  }
});
window.addEventListener("keydown", (event) => {
  if (
    !comp ||
    document.querySelector("dialog[open]") ||
    event.target.matches("input,textarea,select,button")
  )
    return;
  if (event.code === "Space") {
    event.preventDefault();
    $("play").click();
  }
  if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    setPlaying(false);
    setTime(time + (event.key === "ArrowLeft" ? -1 : 1) / comp.fps);
  }
});
window.addEventListener("beforeunload", (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
new ResizeObserver(fit).observe($("canvas-area"));
function loop(now) {
  if (playing && ready && comp) {
    const next = time + (now - last) / 1000;
    if (next >= comp.duration) {
      setTime((Math.ceil(comp.duration * comp.fps) - 1) / comp.fps);
      setPlaying(false);
    } else setTime(next);
  }
  last = now;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
try {
  const value = await request("/api/project");
  install(value);
  setTime(Math.min(1.2, comp.duration / 2));
} catch (e) {
  $("project-title").textContent = "Could not open project";
  notify(e.message, true);
}
