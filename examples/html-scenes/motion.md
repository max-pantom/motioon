---
title: HTML, on your timeline
aspect_ratio: "640x360"
duration: 3s
fps: 30
background: "#181626"
---

# Direction
Use native HTML and CSS with scene-local animations. The runtime pauses CSS
animations and sets their time explicitly; seeking backwards gives the same frame.

## Scene: hello (0s-1.5s)
<style>
  .raw-title { position: absolute; inset: 0; display: grid; place-content: center; font: 600 48px system-ui; margin: 0; }
  .raw-title span { font-size: 16px; font-weight: 400; opacity: .65; margin-top: 15px; }
  @keyframes arrive { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .hello { animation: arrive .7s both; }
</style>
<h1 class="raw-title hello" data-motion="hello">Just HTML.<span>And a little imagination.</span></h1>

## Scene: goodbye (1.5s-3s)
<h1 class="raw-title" data-motion="goodbye">Every frame, yours.</h1>
<script>
  motion.onFrame(({time}) => {
    const el = document.querySelector('[data-motion="goodbye"]');
    el.style.opacity = motion.sequence(1.5, .5, time);
    el.style.transform = `translateY(${motion.interpolate({input: time, range:[1.5,2.2],output:[20,0],easing:'ease-out'})}px)`;
  });
</script>
