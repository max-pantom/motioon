(() => {
  const m = window.__motion;
  const comp = window.__MOTION_COMP__;
  if (!m || !comp) return;
  const root = document.getElementById("studio-root");
  if (!root) return;

  root.innerHTML = `
    <div>
      <div id="studio-title">${comp.title}</div>
      <div style="color:#71717a;font-size:11px">${comp.width}×${comp.height} · ${comp.fps}fps</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <button id="studio-play" type="button">Play</button>
      <input id="studio-scrub" type="range" min="0" max="${comp.duration}" step="${1 / comp.fps}" value="0" />
    </div>
    <div id="studio-time">0.00 / ${comp.duration.toFixed(2)}s</div>
  `;

  const scrub = root.querySelector("#studio-scrub");
  const time = root.querySelector("#studio-time");
  const play = root.querySelector("#studio-play");
  let playing = false;
  let last = 0;

  function stamp(t) {
    time.textContent = `${t.toFixed(2)} / ${comp.duration.toFixed(2)}s`;
    scrub.value = String(t);
  }

  window.addEventListener("motion:seek", (e) => stamp(e.detail.t));

  scrub.addEventListener("input", () => {
    playing = false;
    play.textContent = "Play";
    m.seek(Number(scrub.value));
  });

  play.addEventListener("click", () => {
    playing = !playing;
    play.textContent = playing ? "Pause" : "Play";
    last = performance.now();
  });

  function loop(now) {
    if (playing) {
      const dt = (now - last) / 1000;
      last = now;
      let next = m.currentTime + dt;
      if (next >= comp.duration) {
        next = 0;
        playing = false;
        play.textContent = "Play";
      }
      m.seek(next);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
