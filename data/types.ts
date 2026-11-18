// Shape of one day's brief. Today it is hand-built from the Pre-Market Brief; the ingestion
// pipeline should produce exactly this shape, one record per day.

/** Direction or status of a reading. Never shown as colour alone: chips and changes always carry words or ▲/▼. */
export type Tone = "gain" | "loss" | "mixed" | "info" | "plain";

/** Rich text: plain strings, bold leads, source tags and glossary terms, in reading order. */
export type Rich = Array<string | { b: string } | { src: string[] } | { term: string; label: string }>;

export interface Pressure { k: string; v: string; lv: 0 | 1 | 2; why: string }
export interface Kpi { label: string; term?: string; v: string; unit?: string; d: string; dNote: string; src: string[] }
export interface Takeaway { chip: [string, Tone]; h: string; p: string; why: string; src: string[] }
/** A dated row. `date` (ISO start) and `end` (ISO, a range's last day) are set only for firm dates; a row with
 *  neither is never plotted on a time line and nothing is estimated for it. */
export interface CalendarItem {
  w: string; t: string; d?: string; date?: string; end?: string; today?: boolean; chip?: [string, Tone];
  /** Holding types the brief's own text links to this event. Set only where a sentence in the brief states the link; each tag
   *  and its quoted sentence is recorded in docs/portfolio-event-tags.md. Absent means no link is stated, not "no effect". */
  affects?: HoldingId[];
}
/** The holding types that carry a weight in Portfolio Lens (not the household-costs note `wallet`). */
export type HoldingId = "index" | "fin" | "mid" | "flexi" | "elss" | "it" | "gold" | "silver" | "debt" | "oil" | "consumer" | "realty";
export interface Holding { id: string; n: string; d: "up" | "down" | "mixed"; h: string; w: string; t: string; src: string[] }
/** [move, tone, note, sector] */
export type StockNote = [string, Tone, string, string];
export interface Theme { n: string; s: [string, number][] }
export interface Rotation { lane: string; out: [string, string][]; into: [string, string][]; note: string }
/** [sector, change, context, read, tone, meaning] */
export type TrendRow = [string, string, string, string, Tone, string];
/** label, value, optional other end of a range reported by another source */
export type SectorMove = [string, number | null, number?];
/** One scheduled release: name, region, basis (y/y, m/m), latest, forecast and previous print in %, null = n/a. */
export interface Release {
  n: string; region: string; basis?: string; latest: number | null; forecast: number | null; prior: number | null;
  /** What the previous print refers to ("Sep"), or "previous". */
  priorLabel: string;
  /** When a release not yet out is due (IST). */
  due?: string;
  /** What the brief says about a release whose figure it does not give. */
  note?: string;
  tone: Tone; src: string[];
}
export interface Story { t: string; st: "NEW" | "ONGOING"; day: string; p: string; m: string; w: string; src: string[] }

export interface Brief {
  date: string;
  dateLabel: string;
  dateShort: string;
  prepared: string;
  /** The brief's own date (ISO). Every "days from today" distance counts from here, never from the build clock. */
  briefDate: string;
  session: string;
  /** ISO date of the session the brief describes (the Wander Index is read as of this day). */
  sessionDate: string;
  /** NSE cash-session hours (IST) for the day, when they differ from the regular 09:15–15:30 (a special session). */
  hours?: { open: string; close: string };
  lede: Rich;
  kpis: { gift: Kpi; fii: Kpi; usdinr: Kpi };
  pressure: Pressure[];
  takeaways: Takeaway[];
  drove: string[];
  next: CalendarItem[];
  holdings: Holding[];
  defaultHold: string[];
  stocks: Record<string, StockNote>;
  aliases: Record<string, string>;
  defaultWatch: string[];
  flows: { day: { label: string; fii: number; dii: number }; mtd: { label: string; fii: number; dii: number; sessions: number }; src: string[] };
  monthly: { m: string; fii: number; dii: number | null; approx?: boolean }[];
  /** [index, close, change, tone, note] */
  india: [string, string, string, Tone, string][];
  secIndia: SectorMove[];
  secIndiaNa: string[];
  secUS: SectorMove[];
  themesIn: Theme[];
  rotation: Rotation[];
  trend: TrendRow[];
  /** [sector, change, why, view] */
  secan: [string, string, string, string][];
  /** [name, move, tone, why, hasNews] */
  movers: [string, string, Tone, string, boolean][];
  /** [contract, level, change, note] */
  mcx: [string, string, string, string][];
  fx: [string, string, string, string][];
  fxDrivers: string[];
  ahIn: [string, string][];
  conflicts: [string, string][];
  /** [index, close, change, driver, India link] */
  global: [string, string, string, string, string][];
  /** [measure, level, change, headwind for India] */
  macro: [string, string, string, boolean][];
  macroView: string;
  /** [sector, change, what moved, view] */
  usan: [string, string, string, string][];
  /** [ticker, after hours, tone, reason] */
  usah: [string, string, Tone, string][];
  nvidia: string[];
  cpi: { sep: number; oct: number; food: number; forecast: number };
  /** [IST, event, forecast, previous] */
  ppi: [string, string, string, string][];
  /** [region, indicator, latest, previous, detail, next, how to read, tone, source] */
  indicators: [string, string, string, string, string, string, string, Tone, string][];
  /** The scheduled releases among the indicators, as numbers for the release bars (all in %). A null is n/a;
   *  a null `latest` with `due` set is a release not out yet when the brief was prepared. */
  releases: Release[];
  events: CalendarItem[];
  erDeadline: string;
  /** [company, sector, context] */
  erToday: [string, string, string][];
  erTodayMore: string;
  erTom: [string, string, string][];
  /** [date, company, timing, why it matters, high impact] */
  erUS: [string, string, string, string, boolean][];
  /** [company, market, reported, reaction, tone] */
  erDone: [string, string, string, string, Tone][];
  erLessons: [string, string][];
  stories: Story[];
  /** id → [term, definition, today's number] */
  gloss: Record<string, [string, string, string]>;
  sources: [string, string][];
  web: [string, string, string][];
  method: string[];
}
