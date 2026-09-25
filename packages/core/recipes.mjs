import { readFileSync } from "node:fs";
import { parse } from "yaml";

const openai = parse(
  readFileSync(new URL("./recipes/openai.yml", import.meta.url), "utf8"),
);
const openaiLaunch = parse(
  readFileSync(new URL("./recipes/openai-launch.yml", import.meta.url), "utf8"),
);

export const recipes = Object.freeze({
  openai: Object.freeze(openai),
  "openai-launch": Object.freeze(openaiLaunch),
});

export function resolveRecipe(id) {
  if (id == null) return null;
  if (typeof id !== "string" || !recipes[id])
    throw new Error(
      `Unknown recipe '${id}'. Available recipes: ${Object.keys(recipes).join(", ")}.`,
    );
  return recipes[id];
}
