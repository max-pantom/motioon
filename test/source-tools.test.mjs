import test from "node:test";
import assert from "node:assert/strict";
import {
  highlightSource,
  replaceSourceValue,
  shiftedPosition,
  sourceColors,
  sourceValueAt,
} from "../packages/studio/source-tools.js";

test("source quick editor finds values and colors without changing surrounding YAML", () => {
  const source = `## scene: first\n\`\`\`motion\nelements:\n  - id: title\n    color: "#0071E3"\n    x: 50%\n\`\`\`\n`;
  assert.deepEqual(sourceColors(source), ["#0071E3"]);
  const color = sourceValueAt(source, source.indexOf("#0071E3"));
  assert.equal(color.key, "color");
  assert.equal(color.color.value, "#0071E3");
  assert.equal(
    replaceSourceValue(source, color.color, "#FF4400"),
    source.replace("#0071E3", "#FF4400"),
  );
  const x = sourceValueAt(source, source.indexOf("50%"));
  assert.equal(x.key, "x");
  assert.equal(
    replaceSourceValue(source, x, "60%"),
    source.replace("50%", "60%"),
  );
});

test("source highlighting escapes HTML and marks editable tokens", () => {
  const html = highlightSource("# Scene\ncolor: '#ffffff'\ntext: '<b>'");
  assert.match(html, /syntax-heading/);
  assert.match(html, /syntax-key/);
  assert.match(html, /syntax-color/);
  assert.match(html, /&lt;b&gt;/);
  assert.doesNotMatch(html, /<b>/);
});

test("canvas movement keeps authored position units", () => {
  assert.equal(shiftedPosition("50%", 30, 320), "59.375%");
  assert.equal(shiftedPosition("40px", -10, 320), "30px");
  assert.equal(shiftedPosition(120, 5, 320), 125);
  assert.equal(shiftedPosition("calc(50% - 3px)", 20, 320), null);
});
