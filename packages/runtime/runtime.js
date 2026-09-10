(() => {
  const comp = window.__MOTION_COMP__;
  const callbacks = [],
    tracks = [];
  let nodes = [],
    animations = [],
    stage;
  const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x));
  const easings = {
    linear: (t) => t,
    "ease-out": (t) => 1 - (1 - t) ** 3,
    "ease-in": (t) => t ** 3,
    "ease-in-out": (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
    "expo.out": (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  };
  function ease(name, t) {
    return (easings[name] || easings["ease-out"])(clamp(t));
  }
  function interpolate({
    input,
    range = [0, 1],
    output = [0, 1],
    easing = "linear",
  }) {
    let i = 0;
    while (i < range.length - 2 && input > range[i + 1]) i++;
    const p = ease(easing, (input - range[i]) / (range[i + 1] - range[i] || 1));
    return output[i] + (output[i + 1] - output[i]) * p;
  }
  function sample(name, p) {
    const s = {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      blur: 0,
      clip: "none",
    };
    if (
      [
        "fade",
        "fade-up",
        "fade-down",
        "scale-fade",
        "blur-in",
        "slide-left",
        "slide-right",
        "pop",
        "zoom-out",
        "rotate-in",
      ].includes(name)
    )
      s.opacity = p;
    if (name === "fade-up") s.y = (1 - p) * 24;
    if (name === "fade-down") s.y = (p - 1) * 24;
    if (name === "scale-fade") s.scale = 0.92 + 0.08 * p;
    if (name === "blur-in") s.blur = (1 - p) * 12;
    if (name === "wipe-left") s.clip = `inset(0 ${(1 - p) * 100}% 0 0)`;
    if (name === "wipe-up") s.clip = `inset(${(1 - p) * 100}% 0 0 0)`;
    if (name === "slide-left") s.x = (1 - p) * 80;
    if (name === "slide-right") s.x = (p - 1) * 80;
    if (name === "pop") s.scale = 0.72 + 0.28 * p;
    if (name === "zoom-out") s.scale = 1.18 - 0.18 * p;
    if (name === "rotate-in") {
      s.rotation = (1 - p) * -8;
      s.y = (1 - p) * 22;
    }
    return s;
  }
  function amount(m, t) {
    return ease(
      m.easing,
      m.duration === 0 ? (t >= m.delay ? 1 : 0) : (t - m.delay) / m.duration,
    );
  }
  function applyElement(el, s, local) {
    const t = local - s.at;
    const tokens = [...el.querySelectorAll(".motion-token")];
    const alive = t >= 0 && t < s.duration && !s.hidden;
    el.style.display = alive ? "" : "none";
    if (!alive) return;
    let opacity = s.opacity ?? 1,
      x = 0,
      y = 0,
      scale = s.scale ?? 1,
      rotation = s.rotation || 0,
      blur = 0,
      clip = "none";
    const motions = [];
    if (s.enter && !tokens.length)
      motions.push(sample(s.enter.preset, amount(s.enter, t)));
    if (s.exit)
      motions.push(
        sample(
          s.exit.preset,
          1 -
            amount(
              { ...s.exit, delay: 0 },
              t - (s.duration - s.exit.delay - s.exit.duration),
            ),
        ),
      );
    for (const v of motions) {
      opacity *= v.opacity;
      x += v.x;
      y += v.y;
      scale *= v.scale;
      rotation += v.rotation;
      blur += v.blur;
      if (v.clip !== "none") clip = v.clip;
    }
    el.style.opacity = opacity;
    el.style.filter = blur ? `blur(${blur}px)` : "none";
    el.style.clipPath = clip;
    el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale}) rotate(${rotation}deg)`;
    for (const token of tokens) {
      const index = Number(token.dataset.token);
      const delay = index * (s.stagger ?? 0.045);
      const tokenMotion = s.enter
        ? sample(
            s.enter.preset,
            amount({ ...s.enter, delay: s.enter.delay + delay }, t),
          )
        : sample("none", 1);
      token.style.opacity = tokenMotion.opacity;
      token.style.filter = tokenMotion.blur
        ? `blur(${tokenMotion.blur}px)`
        : "none";
      token.style.clipPath = tokenMotion.clip;
      token.style.transform = `translate(${tokenMotion.x}px,${tokenMotion.y}px) scale(${tokenMotion.scale}) rotate(${tokenMotion.rotation}deg)`;
    }
  }
  function seek(seconds) {
    if (!Number.isFinite(seconds)) throw new Error("Seek time must be finite.");
    const t = clamp(
      seconds,
      0,
      Math.max(0, (Math.ceil(comp.duration * comp.fps) - 1) / comp.fps),
    );
    api.currentTime = t;
    api.time = t;
    api.frame = Math.round(t * comp.fps);
    api.progress = t / comp.duration;
    for (const { node, spec, elements } of nodes) {
      const local = t - spec.start;
      const visible = local >= 0 && local < spec.duration;
      node.classList.toggle("active", visible);
      node.style.opacity = visible
        ? spec.transition.type === "fade" && spec.transition.duration > 0
          ? clamp(local / spec.transition.duration)
          : 1
        : 0;
      node.style.clipPath = "none";
      node.style.transform = "none";
      node.style.filter = "none";
      if (visible && spec.transition.duration > 0) {
        const p = ease("ease-out", local / spec.transition.duration);
        if (spec.transition.type === "wipe-left")
          node.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        if (spec.transition.type === "wipe-up")
          node.style.clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
        if (spec.transition.type === "slide-left")
          node.style.transform = `translateX(${(1 - p) * 12}%)`;
        if (spec.transition.type === "zoom") {
          node.style.transform = `scale(${1.08 - 0.08 * p})`;
          node.style.filter = `blur(${(1 - p) * 10}px)`;
          node.style.opacity = p;
        }
      }
      for (const { el, s } of elements) applyElement(el, s, local);
    }
    for (const { animation, start } of animations) {
      animation.pause();
      animation.currentTime = (t - start) * 1000;
    }
    for (const track of tracks) {
      const p = ease(
        track.ease || "ease-out",
        (t - (track.start || 0)) / (track.duration || 0.001),
      );
      for (const el of document.querySelectorAll(track.selector)) {
        let x = 0,
          y = 0,
          scale = 1,
          rotation = 0;
        for (const [key, val] of Object.entries(track)) {
          if (!Array.isArray(val)) continue;
          const stops = val.map((_, index) => index / (val.length - 1));
          const v = interpolate({ input: p, range: stops, output: val });
          if (key === "x") x = v;
          else if (key === "y") y = v;
          else if (key === "scale") scale = v;
          else if (key === "rotation") rotation = v;
          else el.style[key] = v;
        }
        el.style.transform = `translate(${x}px,${y}px) scale(${scale}) rotate(${rotation}deg)`;
      }
    }
    for (const cb of callbacks) cb(api);
    window.dispatchEvent(new CustomEvent("motion:seek", { detail: { t } }));
    return t;
  }
  async function seekAsync(t) {
    await api.ready;
    seek(t);
    return api.currentTime;
  }
  function getElements() {
    return [
      ...stage.querySelectorAll(
        "[data-motion-id],[data-motion]:not(.scene),.el",
      ),
    ].map((el) => {
      const r = el.getBoundingClientRect(),
        s = el.closest(".scene"),
        style = getComputedStyle(el);
      return {
        id: el.dataset.motionId || el.dataset.motion || el.dataset.id,
        scene: s?.dataset.id,
        text: el.textContent,
        type: el.tagName.toLowerCase(),
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        visible:
          !!s?.classList.contains("active") &&
          style.display !== "none" &&
          Number(style.opacity) > 0,
        overflow:
          r.x < -0.5 ||
          r.y < -0.5 ||
          r.right > comp.width + 0.5 ||
          r.bottom > comp.height + 0.5,
      };
    });
  }
  const api =
    (window.motion =
    window.__motion =
      {
        version: 1,
        width: comp.width,
        height: comp.height,
        fps: comp.fps,
        duration: comp.duration,
        time: 0,
        currentTime: 0,
        frame: 0,
        progress: 0,
        seek,
        seekAsync,
        interpolate,
        ease,
        clamp,
        getElements,
        spring: ({ time, frequency = 3, damping = 8 }) =>
          time <= 0
            ? 0
            : 1 -
              Math.exp(-damping * time) *
                Math.cos(2 * Math.PI * frequency * time),
        stagger: (index, interval = 0.1) => index * interval,
        sequence: (start, duration, time = api.time) =>
          clamp((time - start) / duration),
        onFrame: (cb) => {
          callbacks.push(cb);
          return () => {
            const i = callbacks.indexOf(cb);
            if (i >= 0) callbacks.splice(i, 1);
          };
        },
        animate: (selector, config) => tracks.push({ selector, ...config }),
        mount() {
          stage = document.getElementById("stage");
          nodes = [...document.querySelectorAll(".scene")].map((node, i) => ({
            node,
            spec: comp.scenes[i],
            elements: [...node.querySelectorAll(".el")].map((el) => ({
              el,
              s: JSON.parse(el.dataset.spec),
            })),
          }));
          const captureAnimations = () => {
            animations = document.getAnimations().map((animation) => ({
              animation,
              start: Number(
                animation.effect?.target?.closest(".scene")?.dataset.start || 0,
              ),
            }));
            for (const { animation } of animations) animation.pause();
          };
          captureAnimations();
          seek(0);
          api.ready = Promise.all([
            document.fonts.ready,
            ...[...stage.querySelectorAll("img")].map((img) =>
              img.decode().catch(() => {
                throw new Error(
                  `Image failed to load: ${img.getAttribute("src")}`,
                );
              }),
            ),
          ]).then(() => {
            captureAnimations();
            seek(api.time);
            return true;
          });
          api.ready.catch((error) => {
            api.error = error.message;
            if (parent !== window)
              parent.postMessage(
                { type: "motion:error", message: error.message },
                "*",
              );
          });
          window.addEventListener("message", (event) => {
            if (event.source !== parent) return;
            if (event.data?.type === "motion:seek") {
              try {
                seek(event.data.time);
              } catch {}
            }
            if (event.data?.type === "motion:selection") {
              for (const el of stage.querySelectorAll(".el")) {
                el.style.outline =
                  el.dataset.id === event.data.id ? "2px solid #0a84ff" : "";
                el.style.outlineOffset = "6px";
              }
            }
          });
          stage.addEventListener("click", (event) => {
            const el = event.target.closest("[data-motion-id], [data-motion]");
            if (el)
              parent.postMessage(
                {
                  type: "motion:select",
                  id: el.dataset.motionId || el.dataset.motion,
                },
                "*",
              );
          });
          if (parent !== window)
            parent.postMessage({ type: "motion:ready" }, "*");
        },
      });
})();
