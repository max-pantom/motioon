import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initProject, listSkills } from "../packages/cli/main.mjs";
import { loadComposition, checkAssets } from "../packages/core/index.mjs";

test("project creation preserves existing files and creates a valid starter in an empty directory", () => {
  const dir = mkdtempSync(join(tmpdir(), "motioon-init-"));
  try {
    mkdirSync(join(dir, "assets"));
    const asset = join(dir, "assets", "mark.svg");
    writeFileSync(asset, "<svg>Existing artwork</svg>");
    assert.throws(() => initProject(dir), /must be empty/);
    assert.equal(readFileSync(asset, "utf8"), "<svg>Existing artwork</svg>");
    assert.equal(existsSync(join(dir, "motion.md")), false);
    const result = initProject(join(dir, "new-project"));
    const comp = loadComposition(result.file);
    assert.equal(comp.scenes.length, 3);
    checkAssets(comp);
    assert.throws(() => initProject(result.dir), /already exists/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("bundled skill registry exposes readable files and the craft router", () => {
  const skills = listSkills();
  assert.equal(skills.length, 15);
  assert(skills.some((skill) => skill.name === "motion-router"));
  assert(skills.some((skill) => skill.name === "motion-sound"));
  for (const skill of skills) {
    assert(skill.description.length > 0);
    assert(existsSync(skill.path));
  }
});
