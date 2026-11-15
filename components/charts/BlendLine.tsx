"use client";
import { useEffect, useRef, useState } from "react";
import { niceTicks } from "./TimeLine";
import { useWidth } from "./usePlot";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabel = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const one = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MINUS = "−";
const signed = (v: number) => (v > 0 ? "+" : v < 0 ? MINUS : "") + Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
// The shared readout reads these two attributes from any mark that carries them.
const readoutAttrs = (v: string, l: string) => ({ "data-tip-v": v, "data-tip-l": l }); // lint-copy: ok

/** Two lines on one shared scale, both rebased to 100 on the first session: the viewer's mix and Nifty 50. Gaps stay gaps.
 *  Every session is a hover or tap readout; the keyboard reaches one cursor (arrows step a session, PageUp/PageDown 20,
 *  Home and End the ends) and the readout follows it. */
export function BlendLine({ dates, mix, nifty, name }: {
  dates: string[]; mix: (number | null)[]; nifty: (number | null)[] | null; name: string;
}) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 640, phone = W < 480, H = phone ? 240 : 280, l = phone ? 38 : 44, r = 16, t = 14, b = 30;
  const n = dates.length;
  const lastI = mix.findLastIndex((v) => v != null);
  const [cursor, setCursor] = useState<number | null>(null);
  const moved = useRef(false), dot = useRef<SVGCircleElement>(null);
  const at = Math.min(cursor ?? lastI, Math.max(lastI, 0));
  useEffect(() => {
    if (!moved.current) return;
    dot.current?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  }, [at]);
  if (lastI < 0) return null;

  const vals = [...mix, ...(nifty ?? [])].filter((v): v is number => v != null);
  const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.08 || 1;
  const dMin = lo - pad, dMax = hi + pad;
  const X = (i: number) => l + (i / Math.max(1, n - 1)) * (W - l - r), Y = (v: number) => t + (1 - (v - dMin) / (dMax - dMin)) * (H - t - b);
  const path = (a: (number | null)[]) => {
    let d = "", pen = false;
    a.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`; pen = true; });
    return d;
  };
  // Round ticks about a quarter of the range apart, so the scale reads without the readout (niceTicks alone can give just one).
  let yTicks = niceTicks(dMin, dMax);
  if (yTicks.length < 3 || yTicks.some((v) => !Number.isInteger(v))) {
    const raw = (dMax - dMin) / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 5, 10].map((m) => m * mag).filter((s) => s <= raw).at(-1)!;
    yTicks = [];
    for (let v = Math.ceil(dMin / step) * step; v <= dMax; v += step) yTicks.push(Math.round(v * 100) / 100);
  }
  // One tick at the first session of each quarter month (two a year on phones), never closer than 56px.
  const xTicks = dates.map((d, i) => ({ d, i })).filter(({ d, i }) => i > 0 && d.slice(5, 7) !== dates[i - 1].slice(5, 7) && (phone ? ["01", "07"] : ["01", "04", "07", "10"]).includes(d.slice(5, 7)))
    .filter((tk, k, all) => k === 0 || X(tk.i) - X(all[k - 1].i) >= 56);
  const fmtTick = (d: string) => (d.slice(5, 7) === "01" ? d.slice(0, 4) : `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(2, 4)}`);
  const step = Math.max(1, Math.ceil(n / (phone ? 100 : 260)));
  const nl = (i: number) => (nifty?.[i] == null ? "n/a" : one(nifty[i]!));
  const tipL = (i: number) => `${dayLabel(dates[i])}${nifty ? ` · Nifty 50 ${nl(i)}` : ""}`;
  const first = dates[0], endV = mix[lastI]!, endN = nifty?.[lastI];
  const aria = `${name} and Nifty 50 over ${n} sessions from ${dayLabel(first)} to ${dayLabel(dates[lastI])}, both rebased to 100. ${name} ends at ${one(endV)} (${signed(endV - 100)})${endN != null ? `, Nifty 50 at ${one(endN)} (${signed(endN - 100)})` : ", Nifty 50 n/a"}.`;
  const onKey = (e: React.KeyboardEvent) => {
    const jump: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, PageUp: -20, PageDown: 20 };
    let next = at;
    if (e.key in jump) next = at + jump[e.key];
    else if (e.key === "Home") next = mix.findIndex((v) => v != null);
    else if (e.key === "End") next = lastI;
    else return;
    e.preventDefault();
    next = Math.min(lastI, Math.max(0, next));
    while (next > 0 && mix[next] == null) next--;
    moved.current = true;
    setCursor(next);
  };
  const cv = mix[at];

  return (
    <div className="bw-plot" ref={ref}>
      <div className="tl-key" aria-hidden="true">
        <span><i className="bl-key-mix" />{name}</span>
        {nifty && <span><i className="tl-key-over" />Nifty 50</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={aria}>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} className={v === 100 ? "bw-base" : "bw-grid"} />
            <text x={l - 8} y={Y(v) + 3} textAnchor="end" className="bw-tick">{v.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</text>
          </g>
        ))}
        {xTicks.map(({ d, i }) => (
          <g key={d}>
            <line x1={X(i)} x2={X(i)} y1={H - b} y2={H - b + 4} className="bw-tickline" />
            <text x={X(i)} y={H - 10} textAnchor="middle" className="bw-tick">{fmtTick(d)}</text>
          </g>
        ))}
        <line x1={l} x2={W - r} y1={H - b} y2={H - b} className="bw-grid" />
        {nifty && <path d={path(nifty.map((_, i) => (mix[i] == null ? null : nifty[i])))} fill="none" className="tl-line tl-over" strokeWidth={1.25} strokeLinejoin="round" pathLength={1} style={{ ["--d" as string]: "0.3s" }} />}
        <path d={path(mix)} fill="none" className="tl-line bl-mix" strokeWidth={1.75} strokeLinejoin="round" pathLength={1} />
        {mix.map((v, i) => (v == null || i % step ? null : (
          <rect key={dates[i]} x={X(i) - (W - l - r) / n * step / 2} y={t} width={Math.max(1, (W - l - r) / n * step)} height={H - t - b}
            fill="transparent" {...readoutAttrs(one(v), tipL(i))} />
        )))}
        {at !== lastI && <circle cx={X(lastI)} cy={Y(endV)} r={4} className="bw-now" aria-hidden="true" />}
        {cv != null && (
          <circle ref={dot} cx={X(at)} cy={Y(cv)} r={4} className={at === lastI ? "bw-now" : "bl-cursor"} tabIndex={0}
            role="group" aria-label={`${name} and Nifty 50 by session. Arrow keys move one session, PageUp and PageDown twenty.`}
            onKeyDown={onKey} onBlur={() => { moved.current = false; setCursor(null); }} {...readoutAttrs(one(cv), tipL(at))} />
        )}
      </svg>
    </div>
  );
}
