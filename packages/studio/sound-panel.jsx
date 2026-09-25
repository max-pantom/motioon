import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "./components/button.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/card.jsx";
import { Waveform } from "./components/waveform.jsx";

function assetSource(track, assets) {
  const id = track.src.match(/^asset:(?:\/\/)?([\w.-]+)$/)?.[1];
  return id ? assets[id] : track.src;
}

function SoundPanel() {
  const [composition, setComposition] = useState(null);
  const [selected, setSelected] = useState(0);
  const [waveform, setWaveform] = useState([]);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const update = (event) => setComposition(event.detail);
    window.addEventListener("motioon:composition", update);
    if (window.motioonComposition) setComposition(window.motioonComposition);
    return () => window.removeEventListener("motioon:composition", update);
  }, []);
  const cues = composition?.audio || [];
  const track = cues[selected] || cues[0];
  const src = track && assetSource(track, composition.assets);
  useEffect(() => {
    let active = true;
    setWaveform([]);
    if (!src) return;
    fetch(src)
      .then((res) => res.arrayBuffer())
      .then((buffer) => new AudioContext().decodeAudioData(buffer))
      .then((decoded) => {
        if (!active) return;
        const samples = decoded.getChannelData(0);
        const count = 80;
        setWaveform(
          Array.from({ length: count }, (_, i) => {
            const start = Math.floor((i / count) * samples.length);
            const end = Math.floor(((i + 1) / count) * samples.length);
            let peak = 0;
            for (let j = start; j < end; j++)
              peak = Math.max(peak, Math.abs(samples[j]));
            return peak;
          }),
        );
      })
      .catch(() => setWaveform([]));
    return () => {
      active = false;
    };
  }, [src]);
  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = 0.55;
    const ended = () => setPlaying(false);
    audio.addEventListener("ended", ended);
    if (playing) audio.play().catch(() => setPlaying(false));
    return () => {
      audio.pause();
      audio.removeEventListener("ended", ended);
    };
  }, [src, playing]);
  if (!composition) return null;
  return (
    <Card aria-label="Sound cues" className="sound-card">
      <CardHeader>
        <CardTitle>Sound cues</CardTitle>
        <CardDescription>
          {cues.length
            ? `${cues.length} cues on this timeline`
            : "No cues in this project"}
        </CardDescription>
      </CardHeader>
      {track && (
        <CardContent>
          <label className="sound-cue-label" htmlFor="sound-cue-select">
            Cue
          </label>
          <select
            id="sound-cue-select"
            value={selected}
            onChange={(e) => {
              setSelected(Number(e.target.value));
              setPlaying(false);
            }}
          >
            {cues.map((cue, index) => (
              <option key={`${cue.id}-${index}`} value={index}>
                {cue.id} · {cue.at.toFixed(2)}s
              </option>
            ))}
          </select>
          <Waveform data={waveform} height={54} barColor="#1d1d22" />
          <div className="sound-cue-actions">
            <span>
              {track.kind} · {track.gain_db} dB
            </span>
            <Button
              type="button"
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? "Stop cue preview" : "Play cue preview"}
            >
              {playing ? "Stop" : "Play cue"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

createRoot(document.getElementById("sound-panel")).render(<SoundPanel />);
