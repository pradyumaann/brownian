// "Today in 3 lines" (components/Glance.tsx). Pure and client-safe: no imports, so it runs under `node --test`.
// Every figure is templated from the day's record; the record's `glance` field supplies only the plain-language
// reasons. A figure that cannot be read, or has no source tag, prints "n/a"; nothing is estimated.

/** The fields of the brief this needs, passed in so the module has no imports. */
export interface GlanceSource {
  /** "Thu 12 Nov" */
  session: string;
  /** [index, close, change, tone, note] */
  india: string[][];
  gift: { v: string; src: string[] };
  next: { w: string; t: string }[];
  glance?: {
    india: { why: string; src: string[] };
    world: { why: string; src: string[] };
    next?: { src: string[] };
  };
}

export interface GlanceLine { text: string; src: string[] }

/** Wording a line must never use (also checked by the intake validator and by scripts/check.mjs on the rendered card). */
export const GLANCE_BANNED: RegExp[] = [ // lint-copy: ok
  /\byou should\b/i, /\bnothing to do\b/i, /\bsafe\b/i, /\bexpect(?:s|ed|ing)?\b/i, /\bneeds? attention\b/i, // lint-copy: ok
  /\b(?:SIPs?|FDs?|fixed deposits?)\b[^.]*\b(?:affected|unaffected|impacted|hit)\b/i,
];
export const LINE_MAX = 25;
export const CARD_MAX = 60;

const DAYS: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const MINUS = "−";

/** "Thu 12 Nov" → "Thursday"; anything else passes through unchanged. */
export const weekday = (session: string) => DAYS[session.slice(0, 3)] ?? session;

/** "25,299.35" → 25299.35, "+0.18%" → 0.18, "−0.74%" → −0.74. Null when it is not a plain number. */
export function num(s: string | undefined): number | null {
  if (!s) return null;
  const t = s.replace(/[,%\s]/g, "").replace(MINUS, "-").replace(/^\+/, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(t)) return null;
  return Number(t);
}

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const clause = (s: string | undefined) => (s ?? "").trim().replace(/[.\s]+$/, "");

export function glanceLines(b: GlanceSource): GlanceLine[] {
  const day = weekday(b.session);
  const nifty = b.india.find((r) => r[0] === "Nifty 50");
  const chg = num(nifty?.[2]);
  const close = num(nifty?.[1]);
  const g = b.glance;

  // 1. India, last session. The change needs the reason's tags (the Nifty row carries none of its own).
  const iSrc = g?.india.src ?? [];
  const iWhy = clause(g?.india.why);
  const move = chg === null || !iSrc.length ? "moved n/a" : chg === 0 ? "were flat" : `${chg > 0 ? "rose" : "fell"} ${Math.abs(chg).toFixed(2)}%`;
  const l1 = `Indian stocks ${move} on ${day}${iWhy ? `, ${iWhy}` : ""}.`;

  // 2. Overnight, and the overnight Nifty price in GIFT City against the last close, as a fact.
  const wWhy = clause(g?.world.why);
  const gift = num(b.gift.v);
  const gap = gift !== null && close ? ((gift - close) / close) * 100 : null;
  const where = gap === null || !b.gift.src.length ? "n/a against"
    : Math.abs(gap) < 0.005 ? "level with" : `about ${Math.abs(gap).toFixed(2)}% ${gap > 0 ? "above" : "below"}`;
  const l2 = `${wWhy ? `Overnight, ${wWhy}. ` : ""}Nifty's overnight price in GIFT City is ${where} ${day}'s close.`;

  // 3. What is scheduled next, then the one calm context line.
  const ev = b.next[0];
  const l3 = `Coming up: ${ev ? `${clause(ev.t)} (${ev.w})` : "n/a"}. A single day's move rarely changes a long-term picture.`;

  return [
    { text: l1, src: iSrc },
    { text: l2, src: [...new Set([...b.gift.src, ...(g?.world.src ?? [])])] },
    { text: l3, src: ev ? (g?.next?.src ?? []) : [] },
  ];
}

/** Problems with a set of lines: word limits and banned wording. Empty when the card is within the rules. */
export function glanceProblems(lines: string[]): string[] {
  const out: string[] = [];
  lines.forEach((l, i) => {
    if (words(l) > LINE_MAX) out.push(`line ${i + 1} has ${words(l)} words (max ${LINE_MAX})`);
    for (const re of GLANCE_BANNED) { const m = l.match(re); if (m) out.push(`line ${i + 1} uses "${m[0]}"`); }
  });
  const total = lines.reduce((n, l) => n + words(l), 0);
  if (total > CARD_MAX) out.push(`card has ${total} words (max ${CARD_MAX})`);
  return out;
}
