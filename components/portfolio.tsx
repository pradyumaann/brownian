"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { B } from "@/data";
import type { StockNote } from "@/data/types";
import { fillWith, type MoodVars } from "@/lib/bands";
import { blend, fmtPct, SHORT, type MoveFact } from "@/lib/portfolioMath";
import { buildResultIndex, resolveName, resultFor } from "@/lib/resultDates";
import { Chip, DirChip } from "./Chip";
import { dateOf } from "./portfolio/Day";
import { store } from "./portfolio/store";
import { usePort } from "./portfolio/usePort";
import { Src } from "./Src";

/** Picked holding types from the older `ii:held2` key. `example` is true until the viewer picks their own. */
function useHeld() {
  const [held, setHeld] = useState<string[]>(B.defaultHold);
  const [example, setExample] = useState(true);
  useEffect(() => {
    const s = store.get<string[]>("held2");
    if (s) { setHeld(s); setExample(false); }
  }, []);
  return { held, example };
}

/** Markets, Overnight: the blended move of the viewer's mix once weights are saved (`ii:port3`); until then the
 *  picked types with their direction, as before (the older `ii:held2` picks, or the examples). */
export function HoldingsToday({ moves, asOf }: { moves: MoveFact[]; asOf: string }) {
  const { held, example } = useHeld();
  const port = usePort();
  const list = B.holdings.filter((h) => held.includes(h.id));
  if (port.mode === "saved" && Object.keys(port.w).length) {
    const b = blend(port.w, moves);
    const srcs = b.rows.some((r) => r.contrib != null) ? ["D1", "D5"] : [];
    return (
      <div>
        <p className="bw-meta">Your mix, weights you set · session of {dateOf(asOf)}</p>
        <p className="mixline">
          {b.move != null
            ? <><span className={`bw-mono tone-${b.move > 0 ? "gain" : b.move < 0 ? "loss" : "plain"}`}>{b.move > 0 ? "▲ " : b.move < 0 ? "▼ " : ""}{fmtPct(b.move)}</span><Src k={srcs} /> blended one-day move, covering {Math.round(b.covered)}% of your mix{b.excluded.length > 0 && <>; {b.excluded.map((e) => SHORT[e.id]).join(", ")} n/a</>}.</>
            : <>No type in your mix has a move for this session (<span className="bw-na">n/a</span>).</>}
        </p>
        <p className="bw-meta"><Link href="/portfolio/">Your mix, exposure and how it is worked out</Link> · Interpretation, not a forecast.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="bw-meta">{example ? "Example holdings." : `${list.length} holding type${list.length === 1 ? "" : "s"} you picked`}</p>
      {list.length ? (
        <ul className="holdrow">
          {list.map((h) => (
            <li key={h.id}><Link href="/portfolio/">{h.n}</Link> <DirChip d={h.d} /></li>
          ))}
        </ul>
      ) : (
        <p className="bw-meta">No holdings picked yet. Choose them in <Link href="/portfolio/">Portfolio Lens</Link>.</p>
      )}
    </div>
  );
}

/** Impact notes for the holding types in the viewer's mix, written for the day's brief, plus the wallet note
 *  (household costs, not a holding and never weighted). */
export function ImpactNotes({ ids, vars, example }: { ids: string[]; vars: MoodVars; example: boolean }) {
  const list = B.holdings.filter((h) => h.id !== "wallet" && ids.includes(h.id));
  const wallet = B.holdings.find((h) => h.id === "wallet");
  const note = (h: (typeof B.holdings)[number]) => (
    <article key={h.id} className="imp">
      <div className="imp-h"><h3>{h.n}</h3><DirChip d={h.d} /></div>
      <dl>
        <dt>What happened</dt><dd>{h.h}<Src k={h.src} /></dd>
        <dt>What to watch</dt><dd>{h.w}</dd>
        <dt>Perspective</dt><dd>{fillWith(h.t, vars)}</dd>
      </dl>
    </article>
  );
  return (
    <>
      {example && <p className="bw-meta"><Chip>Example</Chip> These notes are for the example mix.</p>}
      {list.length ? <div className="impact">{list.map(note)}</div> : (
        <p className="empty">Give a holding type a weight above to see how today&apos;s news affects it.</p>
      )}
      {wallet && (
        <>
          <h3 className="sub gap-top">Household costs, not a holding</h3>
          <div className="impact">{note(wallet)}</div>
        </>
      )}
      <p className="bw-disclaimer">Interpretation of today&apos;s brief, not a forecast and not advice.</p>
    </>
  );
}


const NAMES = Object.keys(B.stocks);
/** One resolver for the add box and the results-date join, so both read a name the same way (lib/resultDates.ts). */
const resolve = (q: string) => resolveName(q, NAMES, B.aliases);
const RESULTS = buildResultIndex({ briefDate: B.briefDate, names: NAMES, aliases: B.aliases, erToday: B.erToday, erTom: B.erTom, erUS: B.erUS, erDone: B.erDone });

type Msg = { text: string; add?: string[]; anyway?: string; undo?: boolean } | null;

/** "Is my stock in today's news?" Matches every company in the brief plus this week's results calendars. */
export function Watchlist() {
  const [watch, setWatch] = useState<string[]>(B.defaultWatch);
  const [examples, setExamples] = useState(true);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [undo, setUndo] = useState<{ w: string[]; ex: boolean } | null>(null);

  useEffect(() => {
    const s = store.get<string[]>("watch2");
    if (s) { setWatch(s); setExamples(false); }
  }, []);

  const save = (w: string[], ex: boolean) => { setWatch(w); setExamples(ex); if (ex) store.del("watch2"); else store.set("watch2", w); };
  const add = (n: string) => {
    const base = examples ? [] : watch;
    save(base.includes(n) ? base : [n, ...base], false);
    setQ(""); setUndo(null); setMsg({ text: `Added ${n}.` });
  };
  const remove = (i: number) => {
    const n = watch[i];
    setUndo({ w: watch, ex: examples });
    save(watch.filter((_, j) => j !== i), examples);
    setMsg({ text: `Removed ${n}.`, undo: true });
  };
  const reset = () => {
    setUndo({ w: watch, ex: examples });
    save(B.defaultWatch, true);
    setMsg({ text: "Watchlist reset to examples.", undo: true });
  };
  const restore = () => { if (undo) save(undo.w, undo.ex); setUndo(null); setMsg({ text: "Restored." }); };

  const onType = (e: React.ChangeEvent<HTMLInputElement>) => setQ(e.currentTarget.value);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = resolve(q);
    if (r.hit) return add(r.hit);
    if (!r.raw) return setMsg({ text: "Type a stock name or ticker first." });
    setMsg(r.sug?.length
      ? { text: `No exact match for “${r.raw}”. Did you mean`, add: r.sug, anyway: r.raw }
      : { text: `“${r.raw}” isn't in today's brief or results calendars.`, anyway: r.raw });
  };

  return (
    <>
      <form className="wl-form" onSubmit={submit} autoComplete="off">
        <label htmlFor="wl-input" className="bw-label">Stock name or ticker</label>
        <div className="wl-row">
          <input id="wl-input" list="wl-names" value={q} onChange={onType} placeholder="e.g. Eicher Motors, ONGC, NVDA" />
          <button className="bw-btn" type="submit">Add <span className="bw-btn-dot" aria-hidden="true">+</span></button>
        </div>
        <datalist id="wl-names">{NAMES.map((n) => <option key={n} value={n} />)}</datalist>
      </form>
      <p className="wl-msg" aria-live="polite">
        {msg && <>
          {msg.text}
          {msg.add && <> {msg.add.map((n, i) => <span key={n}>{i ? ", " : ""}<button type="button" className="linkbtn" onClick={() => add(n)}>{n}</button></span>)}?</>}
          {msg.anyway && <> <button type="button" className="linkbtn" onClick={() => add(msg.anyway!)}>Add “{msg.anyway}” anyway</button>.</>}
          {msg.undo && undo && <> <button type="button" className="linkbtn" onClick={restore}>Undo</button></>}
        </>}
      </p>
      {watch.length ? (
        <ul className="wl">
          {watch.map((n, i) => {
            // The same resolver reads the note and the date, so a stored alias spelling gets both or neither.
            const key = resolve(n).hit ?? n;
            const d: StockNote | undefined = B.stocks[key];
            const rd = resultFor(RESULTS, n, NAMES, B.aliases);
            const srcs = rd.kind === "due" ? ["W1", "W2"] : rd.kind === "reports" ? ["W4", ...(/nvidia/i.test(key) ? ["W6"] : /home depot/i.test(key) ? ["W7"] : [])] : [];
            return (
              <li key={n} className="wrow">
                <span className="nm">{n}{examples && <> <Chip>Example</Chip></>}</span>
                <span className="mv">{d ? <WatchMove d={d} /> : <Chip>{rd.kind === "none" ? "Not in brief" : "Calendar only"}</Chip>}</span>
                <span className="note">
                  {d ? <>{d[2]} <span className="faint">· {d[3]}</span></> : rd.kind !== "none" ? <>Named only in today&apos;s results calendars; the brief has no other note on it.</> : <>Not mentioned in today&apos;s brief or results calendars. Its sector is on the <Link href="/flows/">Flow Map</Link>.</>}
                  <span className={`rd${rd.kind === "none" ? " none" : ""}`}>{rd.text}{srcs.length > 0 && <Src k={srcs} />}</span>
                </span>
                <button type="button" className="x" onClick={() => remove(i)} aria-label={`Remove ${n}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">Your watchlist is empty. Add a stock above to see if it was in today&apos;s news.</p>
      )}
      <p className="bw-meta"><button className="linkbtn" type="button" onClick={reset}>Reset to examples</button></p>
    </>
  );
}

function WatchMove({ d }: { d: StockNote }) {
  const [v, tone] = d;
  const isMove = /^[+−≈]/.test(v);
  if (isMove) return <span className={`bw-mono tone-${tone}`}>{tone === "gain" ? "▲ " : tone === "loss" ? "▼ " : ""}{v}</span>;
  return <Chip tone={tone}>{v}</Chip>;
}
