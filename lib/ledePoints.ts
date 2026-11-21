import type { Rich } from "@/data/types";

// Splits a Rich lede into one Rich per sentence, keeping every segment in order and rewording nothing.
// A sentence ends at a period followed by whitespace or the end of the text. Source tags have no width
// here, so a period before or after a tag is read the same way, and a tag at a boundary stays with the
// sentence before it. Term buttons are never cut.

/** Words that take a period without ending a sentence. Dotted forms (e.g., i.e., U.S.) are matched by DOTTED. */
const ABBR = new Set(["vs", "rs", "mr", "mrs", "ms", "dr", "prof", "inc", "ltd", "pvt", "corp", "co", "govt", "dept", "approx", "cf", "viz"]);
const DOTTED = /^(?:[a-z]\.)+[a-z]$/i;

type Seg = Rich[number];

const textOf = (s: Seg): string =>
  typeof s === "string" ? s : "b" in s ? s.b : "src" in s ? "" : s.label;

function endsSentence(text: string, i: number): boolean {
  const next = text[i + 1];
  if (next !== undefined && !/\s/.test(next)) return false;
  if (text[i - 1] === ".") return false; // an ellipsis
  const word = /[A-Za-z.]*$/.exec(text.slice(0, i))?.[0] ?? "";
  return !ABBR.has(word.toLowerCase()) && !DOTTED.test(word);
}

/** Text offsets where a new sentence starts. */
function cuts(r: Rich, text: string): number[] {
  const inTerm: [number, number][] = [];
  let at = 0;
  for (const s of r) {
    const len = textOf(s).length;
    if (typeof s !== "string" && "term" in s) inTerm.push([at, at + len]);
    at += len;
  }
  const inside = (p: number) => inTerm.some(([a, b]) => p > a && p < b);

  const out: number[] = [];
  for (let i = text.indexOf("."); i !== -1; i = text.indexOf(".", i + 1)) {
    if (!endsSentence(text, i)) continue;
    let start = i + 1;
    while (start < text.length && /\s/.test(text[start])) start++;
    if (start < text.length && !inside(i + 1) && !inside(start)) out.push(start);
  }
  return out;
}

/** Trims a point's edges. Whitespace just before trailing source tags is an edge too. */
function trimPoint(p: Rich): Rich {
  const out = [...p];
  const trimmed = (s: string | { b: string }, t: string): Seg => (typeof s === "string" ? t : { b: t });

  while (out.length) {
    const s = out[0];
    if (typeof s !== "string" && !("b" in s)) break;
    const t = textOf(s).trimStart();
    if (t) { out[0] = trimmed(s, t); break; }
    out.shift();
  }
  for (let i = out.length - 1; i >= 0; i--) {
    const s = out[i];
    if (typeof s !== "string" && "src" in s) continue;
    if (typeof s !== "string" && "term" in s) break;
    const t = textOf(s).trimEnd();
    if (t) { out[i] = trimmed(s, t); break; }
    out.splice(i, 1);
  }
  return out;
}

export function ledePoints(r: Rich): Rich[] {
  const text = r.map(textOf).join("");
  const at = cuts(r, text);
  const points: Rich[] = [];
  let cur: Rich = [];
  let pos = 0;
  let next = 0;
  const flush = () => { points.push(cur); cur = []; next++; };

  for (const s of r) {
    if (typeof s !== "string" && "src" in s) { cur.push(s); continue; }
    const t = textOf(s);
    if (typeof s !== "string" && "term" in s) {
      if (at[next] === pos) flush();
      cur.push(s);
      pos += t.length;
      continue;
    }
    let from = 0;
    while (next < at.length && at[next] < pos + t.length) {
      const cut = at[next] - pos;
      if (cut > from) cur.push(typeof s === "string" ? t.slice(from, cut) : { b: t.slice(from, cut) });
      from = cut;
      flush();
    }
    if (from < t.length) cur.push(typeof s === "string" ? t.slice(from) : { b: t.slice(from) });
    pos += t.length;
  }
  points.push(cur);

  return points
    .map(trimPoint)
    .filter((p) => p.length > 0);
}
