// Small "Hyper Charts" marks that render on the server: no measuring, no script.

/** A 0–100 score as a row of segments that light up to the score, each in the `spec` colour of its position. */
export function SegMeter({ score, segments = 20, label }: { score: number; segments?: number; label: string }) {
  return (
    <span className="segmeter" role="img" aria-label={label}>
      {Array.from({ length: segments }, (_, i) => {
        const mid = ((i + 0.5) / segments) * 100, lit = mid <= score, k = 1 + Math.min(5, Math.floor((i / segments) * 6));
        return <i key={i} className={lit ? "is-lit" : undefined} style={lit ? { color: `var(--spec-${k})` } : undefined} />;
      })}
    </span>
  );
}

/** The last few sessions as glowing bars. `signed` draws bars up and down from zero in gain/loss colours (flows);
 *  otherwise bars rise from the window's low (levels), brightest on the latest bar. Exact values are in the readout. */
export function MiniBars({ values, signed = false, label, fmt = (v: number) => String(v), dates }: {
  values: (number | null)[]; signed?: boolean; label: string; fmt?: (v: number) => string; dates?: string[];
}) {
  const vs = values.filter((v): v is number => v != null);
  if (!vs.length) return null;
  const n = values.length, W = 200, H = 44, gap = 2, bw = (W - gap * (n - 1)) / n;
  const lo = signed ? Math.min(0, ...vs) : Math.min(...vs), hi = signed ? Math.max(0, ...vs) : Math.max(...vs), span = hi - lo || 1;
  const Y = (v: number) => H - 2 - ((v - lo) / span) * (H - 4), zero = signed ? Y(0) : H - 2;
  return (
    <svg className="minibars" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      {values.map((v, i) => {
        if (v == null) return null;
        const y = signed ? Math.min(Y(v), zero) : Math.min(Y(v), H - 4), h = signed ? Math.max(1, Math.abs(Y(v) - zero)) : Math.max(2, H - 2 - y);
        const cls = signed ? (v >= 0 ? "is-gain" : "is-loss") : i === n - 1 ? "is-now" : "is-level";
        return <rect key={i} x={i * (bw + gap)} y={y} width={bw} height={h} rx={Math.min(2, bw / 2)} className={cls}
          data-tip-v={fmt(v)} data-tip-l={dates?.[i] ?? label} />;
      })}
    </svg>
  );
}
