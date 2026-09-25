import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Small offline cue kit for this film. All sounds are synthesized and editable.
const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "assets", "audio");
mkdirSync(out, { recursive: true });
const rate = 48000;

function wav(name, seconds, sample) {
  const count = Math.round(seconds * rate);
  const bytes = Buffer.alloc(44 + count * 2);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + count * 2, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const value = Math.max(-1, Math.min(1, sample(i / rate, i)));
    bytes.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  writeFileSync(join(out, name), bytes);
}

const tau = Math.PI * 2;
const smooth = (v) => Math.max(0, Math.min(1, v));
const sine = (hz, t) => Math.sin(tau * hz * t);
let seed = 0x51a7;
function noise() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
}

wav("air.wav", 14, (t) => {
  const fade = smooth(t / 0.55) * smooth((14 - t) / 1.1);
  const slow = 0.92 + 0.08 * Math.sin(tau * 0.18 * t);
  return (
    fade *
    slow *
    (0.025 * sine(146.83, t) + 0.012 * sine(220, t) + 0.006 * sine(293.66, t))
  );
});

wav("tick.wav", 0.13, (t) => {
  const attack = smooth(t / 0.003);
  const body = Math.exp(-t * 47);
  const dry = 0.33 * sine(630, t) + 0.11 * sine(940, t);
  return attack * body * (dry + 0.08 * noise());
});

wav("arrival.wav", 0.62, (t) => {
  const attack = smooth(t / 0.012);
  const tone =
    0.31 * sine(293.66, t) + 0.17 * sine(440, t) + 0.06 * sine(587.33, t);
  const low = 0.16 * sine(73.42, t) * Math.exp(-t * 13);
  return attack * (tone * Math.exp(-t * 5.5) + low);
});

process.stdout.write(`Wrote three cues to ${out}\n`);
