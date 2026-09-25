const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function sourceColors(source) {
  const seen = new Set();
  return [...source.matchAll(/#[\da-fA-F]{6}\b|#[\da-fA-F]{3}\b/g)]
    .map(([color]) => color.toUpperCase())
    .filter((color) => {
      if (seen.has(color)) return false;
      seen.add(color);
      return true;
    });
}

export function sourceValueAt(source, offset) {
  const start = source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const endIndex = source.indexOf("\n", offset);
  const end = endIndex < 0 ? source.length : endIndex;
  const line = source.slice(start, end);
  const match = /^(\s*)([\w.-]+)(\s*:\s*)(.*?)(\s*)$/.exec(line);
  if (!match || !match[4] || match[4].startsWith("# ")) return null;
  const valueStart =
    start + match[1].length + match[2].length + match[3].length;
  const valueEnd = valueStart + match[4].length;
  const hex = /#[\da-fA-F]{6}\b|#[\da-fA-F]{3}\b/g;
  let color;
  for (const found of match[4].matchAll(hex)) {
    const from = valueStart + found.index;
    if (!color || (offset >= from && offset <= from + found[0].length)) {
      color = { value: found[0], start: from, end: from + found[0].length };
      if (offset >= from && offset <= from + found[0].length) break;
    }
  }
  return {
    key: match[2],
    value: match[4],
    start: valueStart,
    end: valueEnd,
    color,
    line: source.slice(0, start).split("\n").length,
  };
}

export function replaceSourceValue(source, range, value) {
  return source.slice(0, range.start) + value + source.slice(range.end);
}

export function shiftedPosition(value, delta, size) {
  const base = value ?? "50%";
  if (typeof base === "string" && base.trim().endsWith("%")) {
    const n = Number.parseFloat(base);
    return Number.isFinite(n)
      ? `${Number((n + (delta / size) * 100).toFixed(3))}%`
      : null;
  }
  const n = Number.parseFloat(base);
  if (!Number.isFinite(n)) return null;
  const next = Number((n + delta).toFixed(2));
  return typeof base === "string" && base.trim().endsWith("px")
    ? `${next}px`
    : next;
}

export function highlightSource(source) {
  return (
    source
      .split("\n")
      .map((line) => {
        if (/^\s*```/.test(line))
          return `<span class="syntax-fence">${escapeHtml(line)}</span>`;
        if (/^\s*#/.test(line))
          return `<span class="syntax-heading">${escapeHtml(line)}</span>`;
        const match = /^(\s*)([\w.-]+)(\s*:\s*)(.*)$/.exec(line);
        if (!match) return escapeHtml(line);
        const rest = escapeHtml(match[4]).replace(
          /#[\da-fA-F]{6}\b|#[\da-fA-F]{3}\b/g,
          (color) => `<span class="syntax-color">${color}</span>`,
        );
        return `${escapeHtml(match[1])}<span class="syntax-key">${escapeHtml(match[2])}</span><span class="syntax-punctuation">${escapeHtml(match[3])}</span>${rest}`;
      })
      .join("\n") + "\n"
  );
}
