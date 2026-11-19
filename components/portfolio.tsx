"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { B } from "@/data";
import type { StockNote } from "@/data/types";
import { fillWith, type MoodVars } from "@/lib/bands";
import type { Mode } from "@/lib/portfolioMath";
import { buildResultIndex, resolveName, resultFor } from "@/lib/resultDates";
import { Chip, DirChip } from "./Chip";
import { NoneNote } from "./portfolio/NoneNote";
import { store } from "./portfolio/store";
import { Src } from "./Src";

/** Impact notes for the holding types in the viewer's mix, written for the day's brief, plus the wallet note
 *  (household costs, not a holding and never weighted). */
export function ImpactNotes({ ids, vars, mode }: { ids: string[]; vars: MoodVars; mode: Mode }) {
  const example = mode === "example";
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
      {mode === "none" ? (
        <NoneNote line="For a mix, this section gives notes on what happened to each of its holding types and what to watch. Nothing is owned, so only the household-costs note follows." />
      ) : list.length ? <div className="impact">{list.map(note)}</div> : (
        <p className="empty">Give a holding type a weight above to see how today&apos;s news affects it.</p>
      )}
      {wallet && (
        <>
          <h3 className="sub gap-top">Household costs, not a holding</h3>
          <div className="impact">{note(wallet)}</div>
        </>
      )}
      <p className="bw-disclaimer">Interpretation of today&apos;s news, not a forecast and not advice.</p>
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
      : { text: `“${r.raw}” isn't in today's news or results calendars.`, anyway: r.raw });
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
                <span className="mv">{d ? <WatchMove d={d} /> : <Chip>{rd.kind === "none" ? "Not in news" : "Calendar only"}</Chip>}</span>
                <span className="note">
                  {d ? <>{d[2]} <span className="faint">· {d[3]}</span></> : rd.kind !== "none" ? <>Appears only in this week&apos;s results calendars; there is no other news on it today.</> : <>Not in today&apos;s news or results calendars. Its sector is on the <Link href="/flows/">Money Moves</Link>.</>}
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
