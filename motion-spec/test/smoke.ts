import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseMotion } from "../src/index.js";
import { MotionParseError } from "../src/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// 1. Valid fixture parses cleanly.
const fixture = readFileSync(
  path.join(__dirname, "fixtures/basic.motion.md"),
  "utf-8"
);
const { doc, warnings } = parseMotion(fixture);

assert(doc.title === "Product Teaser", "title parsed");
assert(doc.duration === 6.5, "duration parsed as 6.5");
assert(doc.resolution.width === 1080 && doc.resolution.height === 1920, "9:16 -> 1080x1920");
assert(doc.scenes.length === 2, "two scenes parsed");
assert(doc.scenes[0].name === "intro" && doc.scenes[0].start === 0 && doc.scenes[0].end === 2, "intro scene bounds");
assert(doc.scenes[1].name === "reveal" && doc.scenes[1].end === 6.5, "reveal scene bounds");
assert(doc.scenes[0].referencedAssets.includes("logo"), "asset:// ref detected");
// 'vo' is an audio asset — it's consumed by the renderer's audio mix, not
// referenced via asset:// in HTML, so it's expected to warn as "unused".
assert(
  warnings.length === 1 && warnings[0].includes("'vo'"),
  `expected only the 'vo' unused-asset warning, got: ${JSON.stringify(warnings)}`
);
console.log("✓ valid fixture parses with the expected audio-asset warning");

// 2. Unknown asset ref is a hard error.
try {
  parseMotion(`---
aspect_ratio: "16:9"
duration: 2s
---
## Scene: a (0s-2s)
<img src="asset://missing" />
`);
  throw new Error("FAIL: expected MotionParseError for unknown asset");
} catch (e) {
  assert(e instanceof MotionParseError, "throws MotionParseError for unknown asset");
  console.log("✓ unknown asset ref rejected:", (e as Error).message);
}

// 3. Scene end past duration is a hard error.
try {
  parseMotion(`---
aspect_ratio: "1:1"
duration: 2s
---
## Scene: a (0s-3s)
<div>hi</div>
`);
  throw new Error("FAIL: expected MotionParseError for out-of-bounds scene");
} catch (e) {
  assert(e instanceof MotionParseError, "throws MotionParseError for out-of-bounds scene");
  console.log("✓ out-of-bounds scene rejected:", (e as Error).message);
}

// 4. Gap between scenes produces a warning, not an error.
const gapped = parseMotion(`---
aspect_ratio: "16:9"
duration: 5s
---
## Scene: a (0s-1s)
<div>hi</div>

## Scene: b (3s-5s)
<div>bye</div>
`);
assert(gapped.warnings.some((w) => w.includes("gap")), "gap produces a warning");
console.log("✓ gap between scenes warns instead of throwing");

// 5. Explicit pixel resolution passes through untouched.
const pixels = parseMotion(`---
aspect_ratio: "1280x720"
duration: 1s
---
## Scene: a (0s-1s)
<div>hi</div>
`);
assert(pixels.doc.resolution.width === 1280 && pixels.doc.resolution.height === 720, "explicit pixel size honored");
console.log("✓ explicit pixel aspect_ratio honored");

console.log("\nAll smoke tests passed.");
