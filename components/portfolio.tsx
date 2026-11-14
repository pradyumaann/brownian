"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { B } from "@/data";
import type { StockNote } from "@/data/types";
import { fillWith, type MoodVars } from "@/lib/bands";
import { Chip, DirChip } from "./Chip";
import { Src } from "./Src";

// Per-viewer state lives on this device only (same keys as the prototype, so picks carry over).
const store = {
  get<T>(k: string): T | null { try { const v = localStorage.getItem("ii:" + k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } },
  set(k: string, v: unknown) { try { localStorage.setItem("ii:" + k, JSON.stringify(v)); } catch {} },
  del(k: string) { try { localStorage.removeItem("ii:" + k); } catch {} },
};

/** Held holding types. `example` is true until the viewer picks their own. */
function useHeld() {
  const [held, setHeld] = useState<string[]>(B.defaultHold);
  const [example, setExample] = useState(true);
  useEffect(() => {
    const s = store.get<string[]>("held2");
    if (s) { setHeld(s); setExample(false); }
  }, []);
  const toggle = (id: string) => {
    const n = held.includes(id) ? held.filter((x) => x !== id) : [...held, id];
    setHeld(n); setExample(false); store.set("held2", n);
  };
  return { held, example, toggle };
}

/** Brief: one line per holding type the viewer picked, with its direction today. */
export function HoldingsToday() {
  const { held, example } = useHeld();
  const list = B.holdings.filter((h) => held.includes(h.id));
  return (
    <div>
      <p className="bw-meta">{example ? "Example holdings. Choose yours in Portfolio Lens." : `${list.length} holding type${list.length === 1 ? "" : "s"} you picked`}</p>
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

/** Portfolio Lens: pick holding types, read today's impact on each. */
export function Holdings({ vars }: { vars: MoodVars }) {
  const { held, example, toggle } = useHeld();
  const list = B.holdings.filter((h) => held.includes(h.id));
  return (
    <>
      <div className="picker" role="group" aria-label="What you hold">
        {B.holdings.map((h) => (
          <button key={h.id} type="button" className="bw-pill" aria-pressed={held.includes(h.id)} onClick={() => toggle(h.id)}>{h.n}</button>
        ))}
      </div>
      <p className="bw-meta">{example ? `Showing ${B.defaultHold.length} example holdings. Tap to choose your own; your picks stay on this device.` : "Your picks stay on this device."}</p>
      {list.length ? (
        <div className="impact">
          {list.map((h) => (
            <article key={h.id} className="imp">
              <div className="imp-h"><h3>{h.n}</h3><DirChip d={h.d} /></div>
              <dl>
                <dt>What happened</dt><dd>{h.h}<Src k={h.src} /></dd>
                <dt>What to watch</dt><dd>{h.w}</dd>
                <dt>Perspective</dt><dd>{fillWith(h.t, vars)}</dd>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">Pick at least one holding above to see how today&apos;s news affects it.</p>
      )}
      <p className="bw-disclaimer">Interpretation of today&apos;s brief, not a forecast and not advice.</p>
    </>
  );
}

const NAMES = Object.keys(B.stocks);
function resolve(q: string): { hit?: string; raw?: string; sug?: string[] } {
  const s = q.trim().toLowerCase();
  if (!s) return {};
  if (B.aliases[s]) return { hit: B.aliases[s] };
  const exact = NAMES.find((n) => n.toLowerCase() === s);
  if (exact) return { hit: exact };
  const sug = NAMES.filter((n) => n.toLowerCase().includes(s) || Object.entries(B.aliases).some(([a, v]) => v === n && a.startsWith(s))).slice(0, 4);
  return { raw: q.trim(), sug };
}

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
          <input id="wl-input" list="wl-names" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Eicher Motors, ONGC, NVDA" />
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
            const d: StockNote | undefined = B.stocks[n];
            return (
              <li key={n} className="wrow">
                <span className="nm">{n}{examples && <> <Chip>Example</Chip></>}</span>
                <span className="mv">{d ? <WatchMove d={d} /> : <Chip>Not in brief</Chip>}</span>
                <span className="note">
                  {d ? <>{d[2]} <span className="faint">· {d[3]}</span></> : <>Not mentioned in today&apos;s brief or results calendars. Its sector is on the <Link href="/flows/">Flow Map</Link>.</>}
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
