# Evaluation and integration

## Decision

Use the broader `motion/` implementation as the starting architecture, retain the
raw HTML authoring format and validation approach from `motion-spec/`, and replace
the stubbed or incorrect paths. The maintained build is at the repository root.
The two supplied folders remain untouched for comparison.

| Area | Original `motion/` | Original `motion-spec/` | Combined implementation |
|---|---|---|---|
| Input | Structured YAML scene fences | Timed scene headings with HTML | Both normalize into one composition |
| Parsing | Handwritten YAML subset; multiline HTML broken | Real YAML parser and typed validation | Maintained YAML parser, block HTML, comments, objects and list assets |
| Validation | Missing finite-number, fps and scene-bound checks | Better timing/reference checks; some zero-size and coverage gaps | Strict dimensions/times, IDs, asset references, animation settings; gaps/overlaps are warnings |
| Runtime | Seekable primitives, but scaled exports and overwritten opacity | Proposed only | Full-size absolute-time runtime, native CSS seeking, JS hooks, image/font readiness |
| Renderer | Deliberately not implemented | Proposed only | Real parallel PNG capture, frame cache, ordered FFmpeg encoding, audio mix, ranges |
| CLI | Compile/preview, render exits with a stub message | Parser scripts only | Create, validate, describe, compile, inspect, render, Studio, agent, MCP |
| MCP | Handwritten JSON-RPC, incorrect tool result envelope; init pointer | Proposed only | Official SDK, real project creation, validation, source patching, frame images and rendering |
| Persistence | Writes a patches sidecar that is never consumed | None | Atomic source save, YAML fence edits, revision conflict checks, undo/redo |
| Studio | Small dark transport bar, missing asset serving | None | Light split view, canvas, timeline, layers, inspector, source, assets, export |

The supplied design document was treated as visual/product reference material.
Its embedded questions were not interpreted as requests to stop implementation.
The pasted architecture proposal was used as context; speculative features were
not presented as working capabilities.

## Material fixes

- Preview now serves local assets. Missing images fail export rather than hanging.
- No remote Google Fonts dependency is injected into every render.
- Production canvas dimensions exactly match the requested viewport; preview
  scaling happens outside the composition iframe.
- Element opacity is preserved under entrance/exit animation. Shape fill is no
  longer lost in a duplicate `style` attribute.
- Native CSS animations seek to scene-local time; JavaScript can subscribe to the
  same absolute clock. Backward seeks produce the same sampled image.
- Invalid scenes fail before compilation or source persistence. Export refuses
  odd dimensions rather than failing deep inside the encoder.
- HTML and JSON payload serialization cannot accidentally terminate the bootstrap
  script from text content. The raw HTML feature itself remains intentional code.
- Source patches modify the actual markdown, retain creative direction, and reject
  stale revisions rather than silently overwriting another editor's work.
- Frame capture sees a fixed composition snapshot during a render. Browser version,
  runtime and local file contents participate in cache identity. Generated export
  metadata is excluded so exporting does not invalidate its own frame cache.
- Loopback API mutations require a per-session token and verify request origin;
  the composition iframe does not share Studio's origin privileges. File serving
  rejects project traversal and symlinks outside the project.

## Validation evidence

The automated suite covers:

- Both original example formats, real multiline YAML, invalid times/dimensions,
  duplicate IDs, bad references, overlapping coverage and source round-tripping.
- Relative HTML/CSS files in standalone compile output, local asset serving,
  source conflict handling, rejected invalid saves and rejected foreign writes.
- Repeated PNG hashes across backward seeks, including native CSS animations,
  actual viewport dimensions and preserved base opacity.
- Real MP4 and WebM encoding/decoding and exact decoded frame counts, mixed audio,
  cached frame ranges, and source changes invalidating frame capture.
- Studio property edits, persisted undo/redo, invalid source error messages,
  successful export download, and mobile layout without horizontal overflow.
- An actual MCP client handshake, tool discovery, validation, persisted patching,
  image content responses, and standard error results.

A complete 8-second sample was exported at 1280×720 / 30fps (240 frames) using two
capture workers. The initial render took approximately 19.6 seconds on this Mac
with the already-installed Chromium 140 binary. This is an observed local result,
not a promise of rendering faster than playback or a benchmark across machines.
Final run timings and verification artifacts are under `test-results/`.

Desktop and mobile screenshots were inspected. The development environment is an
older Mac; Playwright is pinned to the compatible 1.55.1 release rather than a
newer package whose Chromium installer no longer supports this OS. The renderer
can also use an explicit browser path through `MOTIOON_CHROMIUM`.

## Honest remaining boundaries

This finishes the local V1 described in the README. It is not an After Effects
replacement or an integrated generative-video service. No cloud service, model
provider, automatic beat analysis, embedded video composition, collaborative
editing, or arbitrary JavaScript-to-inspector conversion is claimed. The cache is
conservative at project level; there is no unproven dependency-graph invalidation.
Custom JS is reproducible only when authored against the deterministic clock.
