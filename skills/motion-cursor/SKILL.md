---
name: motion-cursor
description: Add a ready cursor set to UI demo tapes. Use when the shot is a product capture, click-through, typing demo, or the user asks for a pointer, cursor, or mouse. Do not use on type-only cards.
---

# Cursor

A cursor belongs in the captured product tape when possible. Motioon's
`capture` flow records real pointer interaction. For a designed, seekable
cursor, put `cursor:` on a structured scene with timed `move` and `click`
actions. A click's `event:` can also start behavior and audio cues.

## Set (use these ids)

| id | look | when |
|---|---|---|
| `cursor.pointer` | 12×12 ink triangle / system pointer svg | move + rest |
| `cursor.text` | 2×16 i-beam | over inputs |
| `cursor.click` | pointer + 16px ring that scales 0.6→1.4, fade | on click beat |
| `cursor.hand` | open hand, rare | drag |

Use a custom cataloged SVG layer only when the built-in pointer art is not
appropriate. The built-in scene cursor has a brief click ring.

## Actor

```yaml
cursor:
  x: 90%
  y: 85%
  actions:
    - {type: move, at: 0, to: [44%, 52%], duration: 0.6, easing: expo.out}
    - {type: click, at: 0.6, event: select}
```

The runtime samples a subtle curved route at any requested frame. Seek the
click frame to verify alignment. No bounce.

For a planned tape, `cursor.path` accepts ordered `{t, x, y, ease, click}`
points. Put `event: name` on a clicked point to synchronize audio and layer
behaviors. Both path and action formats work in the same renderer.

## Rules

- One cursor. Never two.
- Size 16–22px on 1080p. Smaller than you think.
- Hide on `card` and `point` shots.
- The camera anchor should follow the click target, not the cursor art.
- Seek the path by `t`. Do not use `mousemove`.

## Typing

For inputs, after the click:

```text
0.80 click
0.95 caret on
1.00–1.80 type at 12–16 chars/s
```

Caret is a 1px plate, not a text layer. Do not animate each letter with a rise.
