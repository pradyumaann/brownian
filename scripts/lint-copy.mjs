// Copy lint for the portfolio files: fails on action language (buy, sell, hold as a verb, should, recommend, target,
// rebalance, reduce, increase, advice, advisor, advisory, tips, calls). Word boundaries, case-insensitive.
// Allowed: the exact phrases in ALLOW, and "holding(s)" as a noun. A line can opt out with "lint-copy: ok".
//   node scripts/lint-copy.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(".");
// Files and folders scanned, plus lib/portfolio*.ts (tests excluded).
// components/portfolio/SessionMove.tsx (the front page's Blended session move card) is named on its own so it stays
// scanned if the folder list changes; the Set below keeps it from being counted twice.
const PATHS = ["components/portfolio.tsx", "components/portfolio", "components/portfolio/SessionMove.tsx", "components/EventRail.tsx", "components/Fold.tsx", "components/charts/BlendLine.tsx", "app/portfolio", "lib/resultDates.ts"];

const BANNED = [
  /\bbuy(?:s|ing)?\b/i, /\bsell(?:s|ing)?\b/i, /\bholds?\b/i, /\bshould\b/i, /\brecommend(?:s|ed|ing|ation|ations)?\b/i,
  /\btargets?\b/i, /\brebalanc(?:e|es|ed|ing)\b/i, /\breduc(?:e|es|ed|ing)\b/i, /\bincreas(?:e|es|ed|ing)\b/i,
  /\badvice\b/i, /\badvis(?:or|ors|ory)\b/i, /\btips?\b/i, /\bcalls\b/i,
];
// Exact phrases that may appear even though they contain a banned word.
const ALLOW = ["not investment advice", "not a forecast and not advice", "Gold ETFs, SGBs & jewellery"];

function walk(p) {
  const abs = join(ROOT, p);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [p];
  return readdirSync(abs).flatMap((f) => walk(join(p, f))).filter((f) => /\.(tsx?|mjs)$/.test(f));
}
const libFiles = existsSync(join(ROOT, "lib"))
  ? readdirSync(join(ROOT, "lib")).filter((f) => f.startsWith("portfolio") && /\.tsx?$/.test(f) && !/\.test\./.test(f)).map((f) => "lib/" + f)
  : [];
const files = [...new Set([...PATHS.flatMap(walk), ...libFiles].map((f) => f.replaceAll("\\", "/")))];

let hits = 0;
for (const f of files) {
  readFileSync(join(ROOT, f), "utf8").split(/\r?\n/).forEach((line, i) => {
    if (line.includes("lint-copy: ok")) return;
    let s = line.replace(/\.reduce(?:Right)?\(/g, ".fold(");  // Array.reduce is code, not copy
    for (const a of ALLOW) s = s.split(a).join(" ".repeat(a.length));
    for (const re of BANNED) {
      const m = s.match(re);
      if (m) { hits++; console.log(`${f}:${i + 1}  "${m[0]}"  ${line.trim().slice(0, 110)}`); }
    }
  });
}
console.log(hits ? `copy lint: ${hits} banned word(s) in ${files.length} files` : `copy lint: ${files.length} portfolio files, no action language`);
process.exitCode = hits ? 1 : 0;
