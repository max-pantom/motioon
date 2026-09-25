(() => {
  const comp = window.__MOTION_COMP__;
  const callbacks = [],
    tracks = [];
  const videoSeeks = new WeakMap();
  let nodes = [],
    animations = [],
    stage;
  const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x));
  const springCurve = (t, frequency = 3, damping = 8) =>
    t >= 1
      ? 1
      : t <= 0
        ? 0
        : 1 - Math.exp(-damping * t) * Math.cos(2 * Math.PI * frequency * t);
  const easings = {
    linear: (t) => t,
    "ease-out": (t) => 1 - (1 - t) ** 3,
    "ease-in": (t) => t ** 3,
    "ease-in-out": (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
    "expo.out": (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
    "expo-out": (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
    spring: (t) => springCurve(t),
    "spring.soft": (t) => springCurve(t, 3, 8),
    "spring.snappy": (t) => springCurve(t, 4, 10),
  };
  function ease(name, t) {
    const custom = /^spring\(\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(
      String(name),
    );
    if (custom)
      return springCurve(clamp(t), Number(custom[1]), Number(custom[2] ?? 8));
    const bezier =
      /^cubic-bezier\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)$/.exec(
        String(name),
      );
    if (bezier) {
      const [, x1, y1, x2, y2] = bezier.map(Number);
      const x = clamp(t);
      let u = x;
      const curve = (v, a, b) =>
        3 * (1 - v) ** 2 * v * a + 3 * (1 - v) * v ** 2 * b + v ** 3;
      const slope = (v, a, b) =>
        3 * (1 - v) ** 2 * a + 6 * (1 - v) * v * (b - a) + 3 * v ** 2 * (1 - b);
      for (let i = 0; i < 6; i++)
        u = clamp(u - (curve(u, x1, x2) - x) / (slope(u, x1, x2) || 1));
      return curve(u, y1, y2);
    }
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
      tiltX: 0,
      tiltY: 0,
      perspective: 0,
    };
    if (
      [
        "fade",
        "fade-up",
        "fade-down",
        "scale-fade",
        "rise",
        "blur-in",
        "fade-blur",
        "tilt-in",
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
    if (name === "rise") s.scale = 0.96 + 0.04 * p;
    if (name === "blur-in") s.blur = (1 - p) * 12;
    if (name === "fade-blur") s.blur = (1 - p) * 18;
    if (name === "tilt-in") {
      s.tiltY = (1 - p) * -16;
      s.tiltX = (1 - p) * 3;
      s.perspective = 1200;
    }
    if (name === "wipe-left") s.clip = `inset(0 ${(1 - p) * 100}% 0 0)`;
    if (name === "wipe-up") s.clip = `inset(${(1 - p) * 100}% 0 0 0)`;
    if (name === "reveal") s.clip = `inset(0 0 ${(1 - p) * 100}% 0)`;
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
  function drawStroke(root, p) {
    const shapes = root.querySelectorAll(
      "svg path, svg line, svg polyline, svg polygon, svg circle, svg ellipse, svg rect",
    );
    for (const shape of shapes) {
      let length = Number(shape.dataset.drawLength);
      if (!length || !Number.isFinite(length)) {
        try {
          length = shape.getTotalLength();
        } catch {
          continue;
        }
        if (!Number.isFinite(length)) continue;
        shape.dataset.drawLength = String(length);
      }
      shape.style.strokeDasharray = String(length);
      shape.style.strokeDashoffset = String(length * (1 - p));
    }
  }
  function amount(m, t) {
    return ease(
      m.easing,
      m.duration === 0 ? (t >= m.delay ? 1 : 0) : (t - m.delay) / m.duration,
    );
  }
  function tracksValue(spec, t) {
    let opacity = 1,
      x = 0,
      y = 0,
      scale = 1,
      rotation = 0,
      blur = 0;
    for (const track of spec) {
      const p = ease(
        track.easing,
        track.duration === 0
          ? t >= track.start
            ? 1
            : 0
          : (t - track.start) / track.duration,
      );
      const value = track.from + (track.to - track.from) * p;
      if (track.prop === "opacity") opacity *= value;
      else if (track.prop === "x") x += value;
      else if (track.prop === "y") y += value;
      else if (track.prop === "scale") scale *= value;
      else if (track.prop === "rotation") rotation += value;
      else if (track.prop === "blur") blur += value;
    }
    return { opacity, x, y, scale, rotation, blur };
  }
  function formatCount(count, value) {
    const fixed = value.toFixed(count.decimals || 0);
    const body =
      count.thousands && !(count.decimals > 0)
        ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        : fixed;
    return (count.prefix || "") + body + (count.suffix || "");
  }
  function typedLength(text, elapsed, cps) {
    if (elapsed <= 0) return 0;
    let budget = elapsed * cps;
    let count = 0;
    for (const char of [...text]) {
      const variation = ((char.codePointAt(0) * 17 + count * 43) % 41) / 100;
      budget -= 0.8 + variation;
      if (budget < 0) break;
      count++;
    }
    return count;
  }
  function stageCoord(value, axis) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.endsWith("%"))
      return (
        (Number(value.slice(0, -1)) / 100) *
        (axis === "x" ? comp.width : comp.height)
      );
    return Number(value) || 0;
  }
  function timedPath(points, local) {
    if (local <= points[0].t)
      return {
        x: stageCoord(points[0].x, "x"),
        y: stageCoord(points[0].y, "y"),
      };
    for (let index = 1; index < points.length; index++) {
      const next = points[index];
      if (local <= next.t) {
        const previous = points[index - 1];
        const p = ease(
          next.ease || "expo.out",
          (local - previous.t) / (next.t - previous.t),
        );
        const x0 = stageCoord(previous.x, "x"),
          y0 = stageCoord(previous.y, "y");
        const x1 = stageCoord(next.x, "x"),
          y1 = stageCoord(next.y, "y");
        const dx = x1 - x0,
          dy = y1 - y0;
        const bend =
          Math.sin(Math.PI * p) * Math.min(18, Math.hypot(dx, dy) * 0.035);
        const length = Math.hypot(dx, dy) || 1;
        return {
          x: x0 + dx * p - (dy / length) * bend,
          y: y0 + dy * p + (dx / length) * bend,
        };
      }
    }
    const last = points.at(-1);
    return { x: stageCoord(last.x, "x"), y: stageCoord(last.y, "y") };
  }
  function keyframeValue(points, local) {
    if (local <= points[0].t) return points[0].v;
    for (let index = 1; index < points.length; index++) {
      const next = points[index];
      if (local <= next.t) {
        const previous = points[index - 1];
        const p = ease(
          next.ease || "expo.out",
          (local - previous.t) / (next.t - previous.t),
        );
        return previous.v + (next.v - previous.v) * p;
      }
    }
    return points.at(-1).v;
  }
  function cursorPosition(node, spec, local) {
    const cursor = spec.cursor;
    if (!cursor) return null;
    let x = stageCoord(cursor.x ?? "90%", "x");
    let y = stageCoord(cursor.y ?? "90%", "y");
    let click = 0;
    if (cursor.path) {
      ({ x, y } = timedPath(cursor.path, local));
      for (const point of cursor.path)
        if (point.click && local >= point.t && local < point.t + 0.18)
          click = 1 - (local - point.t) / 0.18;
    }
    const targetOf = (to) => {
      if (typeof to === "string") {
        const target = node.querySelector(to);
        if (!target) return { x, y };
        if (target.dataset.spec) {
          const targetSpec = JSON.parse(target.dataset.spec);
          return {
            x: stageCoord(targetSpec.x ?? "50%", "x"),
            y: stageCoord(targetSpec.y ?? "50%", "y"),
          };
        }
        const rect = target.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const factor = stageRect.width / comp.width || 1;
        return {
          x: (rect.left + rect.width / 2 - stageRect.left) / factor,
          y: (rect.top + rect.height / 2 - stageRect.top) / factor,
        };
      }
      return { x: stageCoord(to[0], "x"), y: stageCoord(to[1], "y") };
    };
    for (const action of cursor.actions) {
      if (local < action.at) break;
      if (action.type === "move") {
        const target = targetOf(action.to);
        const p = ease(
          action.easing || "expo.out",
          (local - action.at) / action.duration,
        );
        const bend =
          Math.sin(Math.PI * p) *
          Math.min(18, Math.hypot(target.x - x, target.y - y) * 0.035);
        const dx = target.x - x;
        const dy = target.y - y;
        const length = Math.hypot(dx, dy) || 1;
        x += dx * p - (dy / length) * bend;
        y += dy * p + (dx / length) * bend;
        if (p < 1) break;
      } else if (
        action.type === "click" &&
        local < action.at + action.duration
      ) {
        const p = (local - action.at) / action.duration;
        click = p < action.hold / action.duration ? 1 : 1 - p;
      }
    }
    return { x, y, click };
  }
  function cubicPoint(points, p) {
    const q = 1 - p;
    return [0, 1].map(
      (axis) =>
        q ** 3 * points[0][axis] +
        3 * q ** 2 * p * points[1][axis] +
        3 * q * p ** 2 * points[2][axis] +
        p ** 3 * points[3][axis],
    );
  }
  function applyElement(el, s, local, scene, cursor) {
    const t = local - s.at;
    const tokens =
      s.type === "text" || s.type === "caption"
        ? [...el.querySelectorAll(":scope > .motion-token")]
        : [];
    const alive = t >= 0 && t < s.duration && !s.hidden;
    el.style.display = alive ? "" : "none";
    if (!alive) return;
    let opacity = s.opacity ?? 1,
      x = 0,
      y = 0,
      scale = s.scale ?? 1,
      rotation = s.rotation || 0,
      blur = s.blur || 0,
      clip = "none";
    let tiltX = 0,
      tiltY = 0,
      perspective = 0,
      pathAngle = 0;
    const motions = [];
    const drawPresets = [s.enter, s.exit].filter(
      (m) => m && m.preset === "draw",
    );
    if (s.enter && s.enter.preset !== "draw" && !tokens.length)
      motions.push(sample(s.enter.preset, amount(s.enter, t)));
    if (s.exit && s.exit.preset !== "draw")
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
      tiltX += s.keyframes?.rotateX ? 0 : v.tiltX;
      tiltY += s.keyframes?.rotateY ? 0 : v.tiltY;
      perspective = Math.max(perspective, v.perspective);
      if (v.clip !== "none") clip = v.clip;
    }
    if (s.animate) {
      const values = tracksValue(s.animate, t);
      opacity *= values.opacity;
      x += values.x;
      y += values.y;
      scale *= values.scale;
      rotation += values.rotation;
      blur += values.blur;
    }
    if (s.keyframes)
      for (const [prop, points] of Object.entries(s.keyframes)) {
        const value = keyframeValue(points, t);
        if (prop === "x") x += value;
        else if (prop === "y") y += value;
        else if (prop === "scale") scale *= value;
        else if (prop === "opacity") opacity *= value;
        else if (prop === "rotation") rotation += value;
        else if (prop === "blur") blur += value;
        else if (prop === "rotateX") {
          tiltX += value;
          perspective = Math.max(perspective, 1200);
        } else if (prop === "rotateY") {
          tiltY += value;
          perspective = Math.max(perspective, 1200);
        }
      }
    if (s.path) {
      const point = timedPath(s.path, t);
      x += point.x - stageCoord(s.x ?? "50%", "x");
      y += point.y - stageCoord(s.y ?? "50%", "y");
    }
    if (s.move === "push" && ["image", "video"].includes(s.type))
      scale *=
        (s.from ?? 1) +
        ((s.to ?? 1.04) - (s.from ?? 1)) * clamp(t / s.duration);
    for (const behavior of s.behaviors || []) {
      const start = behavior.on
        ? comp.events[behavior.on] - scene.start - s.at
        : behavior.at;
      const elapsed = t - start;
      const p = ease(behavior.easing, elapsed / behavior.duration);
      if (behavior.type === "blur")
        blur +=
          (behavior.from ?? 18) +
          ((behavior.to ?? 0) - (behavior.from ?? 18)) * p;
      if (behavior.type === "mask") {
        const size =
          (behavior.from ?? 0) +
          ((behavior.to ?? 140) - (behavior.from ?? 0)) * p;
        let ox = "50%",
          oy = "50%";
        if (behavior.origin === "cursor" && cursor) {
          const cx = stageCoord(s.x ?? "50%", "x");
          const cy = stageCoord(s.y ?? "50%", "y");
          ox = `${((cursor.x - cx + el.offsetWidth / 2) / (el.offsetWidth || 1)) * 100}%`;
          oy = `${((cursor.y - cy + el.offsetHeight / 2) / (el.offsetHeight || 1)) * 100}%`;
        } else if (Array.isArray(behavior.origin)) [ox, oy] = behavior.origin;
        if ((behavior.shape ?? "circle") === "circle")
          clip = `circle(${size}% at ${ox} ${oy})`;
        else if (behavior.shape === "line")
          clip = `inset(0 ${100 - Math.min(size, 100)}% 0 0)`;
        else clip = `inset(${(100 - Math.min(size, 100)) / 2}% 0)`;
      }
      if (behavior.type === "depth") {
        const activation = elapsed < 0 ? 0 : p;
        perspective = behavior.perspective ?? 1200;
        const cx = cursor ? (cursor.x / comp.width - 0.5) * 2 : 0;
        const cy = cursor ? (cursor.y / comp.height - 0.5) * 2 : 0;
        tiltX +=
          activation *
          ((behavior.tilt_x ?? 0) +
            (behavior.react === "cursor" ? -cy * (behavior.strength ?? 2) : 0));
        tiltY +=
          activation *
          ((behavior.tilt_y ?? 0) +
            (behavior.react === "cursor" ? cx * (behavior.strength ?? 2) : 0));
        y +=
          activation *
          (behavior.float_y ?? 0) *
          Math.sin((2 * Math.PI * Math.max(0, t)) / (behavior.period ?? 3.2));
      }
      if (behavior.type === "path") {
        const points = behavior.points || comp.paths[behavior.path].points;
        const at =
          (behavior.from ?? 0) +
          ((behavior.to ?? 1) - (behavior.from ?? 0)) * p;
        if (s.distribution === "glyphs") {
          const glyphs = el.querySelectorAll(":scope > .motion-glyph");
          for (let index = 0; index < glyphs.length; index++) {
            const glyph = glyphs[index];
            const progress = at - index * (s.spacing ?? 0.035);
            glyph.style.opacity = progress < 0 || progress > 1 ? "0" : "1";
            const [gx, gy] = cubicPoint(points, clamp(progress));
            const [nx, ny] = cubicPoint(points, clamp(progress + 0.001));
            const angle =
              behavior.orient === "tangent"
                ? (Math.atan2(ny - gy, nx - gx) * 180) / Math.PI
                : 0;
            glyph.style.left = `${gx - stageCoord(s.x ?? "50%", "x") + el.offsetWidth / 2}px`;
            glyph.style.top = `${gy - stageCoord(s.y ?? "50%", "y") + el.offsetHeight / 2}px`;
            glyph.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
          }
        } else if (elapsed >= 0) {
          const [px, py] = cubicPoint(points, clamp(at));
          x += px - stageCoord(s.x ?? "50%", "x");
          y += py - stageCoord(s.y ?? "50%", "y");
          if (behavior.orient === "tangent") {
            const [nx, ny] = cubicPoint(points, clamp(at + 0.001));
            pathAngle = (Math.atan2(ny - py, nx - px) * 180) / Math.PI;
          }
        }
      }
      if (
        behavior.type === "compress" &&
        elapsed >= 0 &&
        elapsed < behavior.duration
      )
        scale *= 1 - (1 - (behavior.scale ?? 0.97)) * Math.sin(Math.PI * p);
    }
    el.style.opacity = opacity;
    el.style.filter = blur ? `blur(${blur}px)` : "none";
    el.style.clipPath = clip;
    const depthTransform = perspective
      ? ` perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
      : "";
    el.style.transform =
      s.type === "group"
        ? `translate(${x}px,${y}px) scale(${scale}) rotate(${rotation + pathAngle}deg)${depthTransform}`
        : `translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale}) rotate(${rotation + pathAngle}deg)${depthTransform}`;
    if (perspective && s.type !== "group")
      el.style.boxShadow = `${-tiltY * 2}px ${12 + tiltX * 2}px 32px rgba(0,0,0,.13)`;
    else el.style.boxShadow = s.shadow || "";
    if (s.type === "video") {
      el.pause();
      const target = Math.max(
        0,
        Math.min((el.duration || s.duration) - 1 / comp.fps, (s.trim || 0) + t),
      );
      if (
        Number.isFinite(target) &&
        Math.abs(el.currentTime - target) > 0.001
      ) {
        const pending = new Promise((resolve, reject) => {
          const timer = setTimeout(
            () =>
              reject(
                new Error(`Video frame timed out: ${el.getAttribute("src")}`),
              ),
            5000,
          );
          el.addEventListener(
            "seeked",
            () => {
              const done = () => {
                clearTimeout(timer);
                resolve();
              };
              requestAnimationFrame(() => requestAnimationFrame(done));
            },
            { once: true },
          );
        });
        pending.catch(() => {});
        videoSeeks.set(el, pending);
        el.currentTime = target;
      }
    }
    if (drawPresets.length && !tokens.length) {
      const motion = drawPresets[0];
      drawStroke(el, amount(motion, t));
      if (drawPresets[1]) drawStroke(el, 1 - amount(drawPresets[1], t));
    }
    if (tokens.length && s.enter && s.enter.preset === "type") {
      const revealed = Math.floor(
        amount({ ...s.enter, delay: s.enter.delay }, t) * (tokens.length + 1),
      );
      for (const token of tokens) {
        const index = Number(token.dataset.token);
        token.style.opacity = index < revealed ? 1 : 0;
        token.style.filter = "none";
        token.style.clipPath = "none";
        token.style.transform = "none";
      }
    } else
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
    if (s.typewriter && !tokens.length) {
      const count = typedLength(
        String(s.text || ""),
        t - s.typewriter.from,
        s.typewriter.cps,
      );
      const content = [...String(s.text || "")].slice(0, count).join("");
      const caretVisible =
        s.typewriter.caret &&
        count < [...String(s.text || "")].length &&
        t >= s.typewriter.from &&
        Math.floor(t * 3) % 2 === 0;
      if (!el.__motionTyped) {
        el.textContent = "";
        const copy = document.createTextNode("");
        const caret = document.createElement("span");
        caret.className = "motion-typewriter-caret";
        el.append(copy, caret);
        el.__motionTyped = { copy, caret };
      }
      const typed = el.__motionTyped;
      if (typed.copy.nodeValue !== content) typed.copy.nodeValue = content;
      typed.caret.style.display =
        s.typewriter.caret &&
        count < [...String(s.text || "")].length &&
        t >= s.typewriter.from
          ? "inline-block"
          : "none";
      typed.caret.style.opacity = caretVisible ? "1" : "0";
      typed.caret.style.width = "0.035em";
      typed.caret.style.height = "0.84em";
      typed.caret.style.marginLeft = "0.025em";
      typed.caret.style.verticalAlign = "-0.09em";
      typed.caret.style.backgroundColor =
        s.typewriter.caret_color || comp.brand?.accent || "currentColor";
    } else if (s.count && !tokens.length) {
      const progress = ease(
        s.count.easing,
        s.count.duration === 0
          ? t >= s.count.start
            ? 1
            : 0
          : (t - s.count.start) / s.count.duration,
      );
      const text = formatCount(
        s.count,
        s.count.from + (s.count.to - s.count.from) * progress,
      );
      if (el.textContent !== text) el.textContent = text;
    } else if (s.replace?.length && !tokens.length) {
      let text = s.text ?? "";
      for (const entry of s.replace) if (t >= entry.at) text = entry.text;
      if (el.textContent !== text) el.textContent = text;
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
    for (const { node, spec, elements, cursorNode } of nodes) {
      const local = t - spec.start;
      const visible = local >= 0 && local < spec.duration;
      const cursor = spec.cursor ? cursorPosition(node, spec, local) : null;
      node.classList.toggle("active", visible);
      node.style.opacity = visible
        ? spec.transition.type === "fade" && spec.transition.duration > 0
          ? clamp(local / spec.transition.duration)
          : 1
        : 0;
      node.style.clipPath = "none";
      let sceneTransform = "";
      node.style.transform = "none";
      node.style.filter = "none";
      if (visible && spec.transition.duration > 0) {
        const p = ease("ease-out", local / spec.transition.duration);
        if (spec.transition.type === "wipe-left")
          node.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        if (spec.transition.type === "wipe-up")
          node.style.clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
        if (spec.transition.type === "slide-left")
          sceneTransform = `translateX(${(1 - p) * 12}%)`;
        if (spec.transition.type === "zoom") {
          sceneTransform = `scale(${1.08 - 0.08 * p})`;
          node.style.filter = `blur(${(1 - p) * 10}px)`;
          node.style.opacity = p;
        }
      }
      if (visible && spec.camera) {
        const camera = spec.camera;
        const anchor =
          camera.anchor === "cursor" && cursor
            ? [
                `${(cursor.x / comp.width) * 100}%`,
                `${(cursor.y / comp.height) * 100}%`,
              ]
            : Array.isArray(camera.anchor)
              ? camera.anchor
              : ["50%", "50%"];
        node.style.transformOrigin = anchor
          .map((value) => (typeof value === "number" ? `${value}px` : value))
          .join(" ");
        const p = ease(camera.easing || "linear", local / camera.duration);
        const scale =
          (camera.from ?? 1) + ((camera.to ?? 1.04) - (camera.from ?? 1)) * p;
        let dx = 0,
          dy = 0;
        if (camera.follow === "cursor") {
          const target = cursorPosition(
            node,
            spec,
            Math.max(0, local - camera.lag),
          );
          dx = clamp(
            (comp.width / 2 - target.x) * (camera.strength ?? 0.12),
            -40,
            40,
          );
          dy = clamp(
            (comp.height / 2 - target.y) * (camera.strength ?? 0.12),
            -40,
            40,
          );
        }
        sceneTransform += ` translate(${dx}px,${dy}px) scale(${scale})`;
      }
      node.style.transform = sceneTransform || "none";
      if (cursorNode && cursor) {
        cursorNode.style.transform = `translate(${cursor.x}px,${cursor.y}px) scale(${1 - cursor.click * 0.13})`;
        const ring = cursorNode.querySelector(".motion-click-ring");
        ring.style.borderColor =
          spec.cursor.click_color || comp.brand?.accent || "#111111";
        ring.style.opacity = String(cursor.click * 0.7);
        ring.style.transform = `scale(${0.7 + (1 - cursor.click) * 0.65})`;
      }
      for (const { el, s } of elements)
        applyElement(el, s, local, spec, cursor);
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
    await Promise.all(
      [...stage.querySelectorAll("video.el-video")]
        .filter(
          (video) =>
            video.closest(".scene")?.classList.contains("active") &&
            video.style.display !== "none",
        )
        .map(
          (video) =>
            videoSeeks.get(video) ||
            (video.seeking || video.readyState < 2
              ? new Promise((resolve, reject) => {
                  const timer = setTimeout(
                    () =>
                      reject(
                        new Error(
                          `Video frame timed out: ${video.getAttribute("src")}`,
                        ),
                      ),
                    5000,
                  );
                  const done = () => {
                    if (video.seeking || video.readyState < 2) return;
                    clearTimeout(timer);
                    video.removeEventListener("seeked", done);
                    video.removeEventListener("loadeddata", done);
                    resolve();
                  };
                  video.addEventListener("seeked", done);
                  video.addEventListener("loadeddata", done);
                  done();
                })
              : Promise.resolve()),
        ),
    );
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
          !el.classList.contains("el-group") &&
          (r.x < -0.5 ||
            r.y < -0.5 ||
            r.right > comp.width + 0.5 ||
            r.bottom > comp.height + 0.5),
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
          let editMode = false;
          let drag = null;
          nodes = [...document.querySelectorAll(".scene")].map((node, i) => ({
            node,
            spec: comp.scenes[i],
            cursorNode: node.querySelector(".motion-cursor"),
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
            ...[...stage.querySelectorAll("video.el-video")].map(
              (video) =>
                new Promise((resolve, reject) => {
                  video.pause();
                  if (video.readyState >= 1) return resolve();
                  video.addEventListener("loadedmetadata", resolve, {
                    once: true,
                  });
                  video.addEventListener(
                    "error",
                    () =>
                      reject(
                        new Error(
                          `Video failed to load: ${video.getAttribute("src")}`,
                        ),
                      ),
                    { once: true },
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
            const data = event.data;
            if (data?.type === "seek" || data?.type === "motion:seek") {
              try {
                seek(data.t ?? data.time ?? 0);
              } catch {}
            }
            if (data?.type === "select" || data?.type === "motion:selection") {
              for (const el of stage.querySelectorAll(".el")) {
                el.style.outline =
                  el.dataset.id === data.id ? "2px solid #a3e635" : "";
                el.style.outlineOffset = "6px";
              }
            }
            if (data?.type === "motion:edit-mode") {
              editMode =
                Boolean(data.enabled) && document.body.dataset.preview === "1";
              document.body.classList.toggle("motion-edit-mode", editMode);
            }
          });
          stage.addEventListener("pointerdown", (event) => {
            if (!editMode || event.button !== 0) return;
            const el = event.target.closest(".el[data-motion-id]");
            if (
              !el ||
              el.classList.contains("el-group") ||
              !el.closest(".scene.active")
            )
              return;
            event.preventDefault();
            stage.setPointerCapture(event.pointerId);
            drag = {
              id: el.dataset.motionId,
              el,
              x: event.clientX,
              y: event.clientY,
              pointerId: event.pointerId,
            };
            parent.postMessage({ type: "motion:select", id: drag.id }, "*");
          });
          stage.addEventListener("pointermove", (event) => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            drag.el.style.translate = `${event.clientX - drag.x}px ${event.clientY - drag.y}px`;
          });
          const finishDrag = (event) => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (Math.abs(dx) + Math.abs(dy) > 2)
              parent.postMessage(
                { type: "motion:drag", id: drag.id, dx, dy },
                "*",
              );
            else drag.el.style.translate = "";
            drag = null;
          };
          stage.addEventListener("pointerup", finishDrag);
          stage.addEventListener("pointercancel", finishDrag);
          stage.addEventListener("click", (event) => {
            const el = event.target.closest("[data-motion-id], [data-motion]");
            if (el)
              parent.postMessage(
                {
                  type: "select",
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
