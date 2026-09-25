---
name: motion-sound
description: Plan and mix Motion audio. Use when adding ticks, voice, beds, generating SFX, or mixing to LUFS. Triggers include sound, mix, sting, tick, voiceover, TTS, whoosh, loudness.
---

# Sound

Build short, distinct cues and mix them from the `motion.md` cue sheet. Audition
the exported video: a loudness number does not tell you whether a tick sounds
like a cheap beep. Keep original sources editable in the catalog.

## Default kit

Run `motioon sound synth path/to/motion.md` to create missing `tick.cut`,
`tick.point`, `tick.arrive`, and `tick.air` WAVs. `--force` replaces those four
generated files in that project; use it only when replacing the kit is wanted.
`tick.air` is a source option, not a default
bed.

## Plan

```text
at: cuts   → tick.cut  at scene cuts
at: rises  → tick.arrive at rise entrances
voice      → 0 dB, duck bed -8 dB
master     → around -16 LUFS, true peak ≤ -1 dB
```

Recipe `openai-launch` — no bed unless asked.
For a click that also starts a visual behavior, attach `event: select` to the
cursor click, `on: select` to the behavior, and `at: "event:select"` to the
audio cue. This resolves one event time for picture and sound.

## Generate

- The local synth kit is the offline starting point. If the user dislikes its
  timbre, revise or replace the WAVs; do not defend them with a passing meter.
- External SFX and TTS are not built into the current CLI. If provided, import
  the resulting local audio files into `assets/catalog.json` and cue them in
  `motion.md`. Do not write unsupported `via:` fields into the spec.
- A voiced piece should use one consistent voice; leave space around speech.

## Forbidden

Whoosh on a cut. Stings closer than 80ms. Music louder than −16 dB under VO.
For `openai-launch`, skip a continuous bed unless the brief calls for it.
