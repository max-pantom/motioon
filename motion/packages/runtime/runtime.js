(() => {
  const comp = window.__MOTION_COMP__;
  if (!comp) return;

  const stage = document.getElementById("stage");
  const scenes = [...document.querySelectorAll(".scene")];

  const ease = {
    linear: (t) => t,
    "ease-out": (t) => 1 - Math.pow(1 - t, 3),
    "ease-in": (t) => t * t * t,
    "ease-in-out": (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };

  function clamp01(t) {
    return Math.max(0, Math.min(1, t));
  }

  function presetSample(name, p) {
    const o = { opacity: 1, tx: 0, ty: 0, scale: 1, blur: 0, clip: "none" };
    if (!name || name === "none") return o;
    if (name === "fade") o.opacity = p;
    if (name === "fade-up") {
      o.opacity = p;
      o.ty = (1 - p) * 24;
    }
    if (name === "fade-down") {
      o.opacity = p;
      o.ty = (p - 1) * 24;
    }
    if (name === "scale-fade") {
      o.opacity = p;
      o.scale = 0.92 + 0.08 * p;
    }
    if (name === "blur-in") {
      o.opacity = p;
      o.blur = (1 - p) * 12;
    }
    if (name === "wipe-left") {
      o.clip = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;
    }
    return o;
  }

  function motionAmount(m, local) {
    if (!m) return 1;
    const start = m.delay || 0;
    const dur = Math.max(m.duration || 0.001, 0.001);
    const raw = (local - start) / dur;
    const e = ease[m.easing] || ease["ease-out"];
    return e(clamp01(raw));
  }

  function applyElement(el, sceneLocal, sceneDuration) {
    const spec = JSON.parse(el.dataset.motion || "{}");
    const local = sceneLocal - (spec.at || 0);
    const alive = local >= -0.0001 && local <= (spec.duration ?? sceneDuration) + 0.0001;
    el.style.display = alive ? "" : "none";
    if (!alive) return;

    let opacity = 1;
    let tx = 0;
    let ty = 0;
    let scale = 1;
    let blur = 0;
    let clip = "none";

    if (spec.enter) {
      const p = motionAmount(spec.enter, local);
      const s = presetSample(spec.enter.preset, p);
      opacity *= s.opacity;
      tx += s.tx;
      ty += s.ty;
      scale *= s.scale;
      blur += s.blur;
      if (s.clip !== "none") clip = s.clip;
    }

    if (spec.exit) {
      const end = spec.duration ?? sceneDuration;
      const exitStart = end - (spec.exit.delay || 0) - spec.exit.duration;
      const p = 1 - motionAmount({ ...spec.exit, delay: 0 }, local - exitStart);
      const s = presetSample(spec.exit.preset, p);
      opacity *= s.opacity;
      tx += s.tx;
      ty += s.ty;
      scale *= s.scale;
      blur += s.blur;
    }

    el.style.opacity = String(opacity);
    el.style.filter = blur ? `blur(${blur}px)` : "none";
    el.style.clipPath = clip;
    el.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function seek(seconds) {
    const t = Math.max(0, Math.min(comp.duration, seconds));
    for (const scene of scenes) {
      const start = Number(scene.dataset.start);
      const duration = Number(scene.dataset.duration);
      const fade = Number(scene.dataset.transitionDuration || 0);
      const local = t - start;
      const visible = local >= -fade && local <= duration;
      scene.classList.toggle("active", visible);
      scene.style.opacity = visible ? "1" : "0";
      if (!visible) continue;
      if (scene.dataset.transition === "fade" && local < fade && fade > 0) {
        scene.style.opacity = String(clamp01(local / fade));
      }
      for (const el of scene.querySelectorAll(".el")) applyElement(el, local, duration);
    }
    window.__motion.currentTime = t;
    window.dispatchEvent(new CustomEvent("motion:seek", { detail: { t } }));
    return t;
  }

  async function seekAsync(seconds) {
    const t = seek(seconds);
    const imgs = [...stage.querySelectorAll("img")].map(
      (img) => (img.complete ? Promise.resolve() : new Promise((res) => img.addEventListener("load", res, { once: true }))),
    );
    if (document.fonts?.ready) imgs.push(document.fonts.ready);
    await Promise.all(imgs);
    return t;
  }

  function fitStage() {
    const wrap = document.getElementById("stage-wrap");
    if (!wrap) return;
    const pad = 24;
    const maxW = wrap.clientWidth - pad;
    const maxH = wrap.clientHeight - pad;
    const s = Math.min(maxW / comp.width, maxH / comp.height, 1);
    stage.style.transform = `scale(${s})`;
  }

  window.__motion = {
    version: 1,
    width: comp.width,
    height: comp.height,
    fps: comp.fps,
    duration: comp.duration,
    currentTime: 0,
    seek,
    seekAsync,
  };

  window.addEventListener("resize", fitStage);
  fitStage();
  seek(0);
})();
