// Adapted from ElevenLabs UI's Waveform source component (MIT).
// https://github.com/elevenlabs/ui/blob/main/apps/www/registry/elevenlabs-ui/ui/waveform.tsx
import React, { useEffect, useRef } from "react";

export function Waveform({
  data = [],
  barWidth = 3,
  barGap = 2,
  barColor = "#17191d",
  height = 54,
  onBarClick,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const draw = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);
      const count = Math.floor(rect.width / (barWidth + barGap));
      for (let i = 0; i < count; i++) {
        const value = data[Math.floor((i / count) * data.length)] || 0;
        const barHeight = Math.max(3, value * rect.height * 0.82);
        ctx.globalAlpha = 0.3 + value * 0.7;
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(
          i * (barWidth + barGap),
          (rect.height - barHeight) / 2,
          barWidth,
          barHeight,
          2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    draw();
    return () => observer.disconnect();
  }, [data, barWidth, barGap, barColor]);
  return (
    <div className="ui-waveform" ref={containerRef} style={{ height }}>
      <canvas
        ref={canvasRef}
        onClick={(event) => {
          if (!onBarClick || !data.length) return;
          const rect = event.currentTarget.getBoundingClientRect();
          onBarClick(
            Math.floor(
              ((event.clientX - rect.left) / rect.width) * data.length,
            ),
          );
        }}
        aria-label="Sound waveform"
      />
    </div>
  );
}
