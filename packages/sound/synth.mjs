import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const sampleRate = 48000;
const decay = (time, rate) => Math.exp(-time * rate);
const durations = { cut: 0.12, point: 0.2, arrive: 0.3, air: 8 };
const attack = (time, seconds) => Math.min(1, time / seconds);

export function synthSound(kind, duration) {
  const seconds = duration ?? durations[kind];
  if (!seconds || seconds <= 0)
    throw new Error(`Unknown synth sound '${kind}'.`);
  const data = new Float32Array(Math.round(sampleRate * seconds));
  let noise = 0;
  let low = 0;
  let seed = 0x19283746;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const white = ((seed >>> 0) / 0xffffffff) * 2 - 1;
    low += (white - low) * 0.08;
    const dryClick = (white - low) * decay(t, 68) * attack(t, 0.0005);
    if (kind === "cut") {
      const body =
        Math.sin(2 * Math.PI * 215 * t) * 0.28 +
        Math.sin(2 * Math.PI * 345 * t) * 0.06;
      data[i] = (body * decay(t, 15) + dryClick * 0.065) * attack(t, 0.0012);
    } else if (kind === "point") {
      const phase = 2 * Math.PI * (280 * t - 55 * t * t);
      const body = Math.sin(phase) * 0.32 + Math.sin(phase * 2) * 0.045;
      data[i] = (body * decay(t, 11) + dryClick * 0.035) * attack(t, 0.002);
    } else if (kind === "arrive") {
      const body =
        Math.sin(2 * Math.PI * 330 * t) * 0.19 +
        Math.sin(2 * Math.PI * 495 * t) * 0.07;
      data[i] = body * decay(t, 12) * attack(t, 0.012);
    } else {
      noise = noise * 0.995 + white * 0.005;
      data[i] = noise * 0.02;
    }
    if (kind !== "air") data[i] *= Math.min(1, (seconds - t) / 0.012);
  }
  return data;
}

export function wavBuffer(samples, sr = sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sr, 24);
  buffer.writeUInt32LE(sr * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++)
    buffer.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767),
      44 + i * 2,
    );
  return buffer;
}

export function synthKit(projectDir, { catalog = true, force = false } = {}) {
  const output = {};
  for (const kind of ["cut", "point", "arrive", "air"]) {
    const path = join(projectDir, "assets", "audio", `tick.${kind}.wav`);
    mkdirSync(dirname(path), { recursive: true });
    if (force || !existsSync(path))
      writeFileSync(path, wavBuffer(synthSound(kind)));
    output[`tick.${kind}`] = {
      src: relative(projectDir, path),
      kind: kind === "air" ? "room" : "sting",
      dur: durations[kind],
    };
  }
  if (catalog) {
    const path = join(projectDir, "assets", "catalog.json");
    let current = {};
    try {
      current = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    writeFileSync(
      path,
      JSON.stringify(
        force ? { ...current, ...output } : { ...output, ...current },
        null,
        2,
      ) + "\n",
    );
  }
  return output;
}
