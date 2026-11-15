"use client";
import { concentration, exposure, normalise, SHORT, type Weights } from "@/lib/portfolioMath";

/** What the mix is exposed to: the share in each factor and concentration as facts. */
export function Exposure({ w }: { w: Weights }) {
  const ex = exposure(w), c = concentration(w), nm = normalise(w);
  if (!ex.length) return <p className="empty">No weight is set yet. Once a holding type has a weight, the factors it is exposed to are listed here.</p>;
  const top = Math.max(...ex.map((x) => x.share));
  return (
    <div className="two">
      <div>
        <h3 className="sub">By factor</h3>
        <ul className="xbars" aria-label={`Share of your mix by factor: ${ex.map((x) => `${x.name} ${Math.round(x.share)}%`).join(", ")}`}>
          {ex.map((x) => (
            <li key={x.id}>
              <span className="xn">{x.name}</span>
              <span className="xb" aria-hidden="true"><i style={{ width: `${(x.share / top) * 100}%` }} /></span>
              <span className="xv bw-mono">{Math.round(x.share)}%</span>
            </li>
          ))}
          {nm.unallocated > 0 && (
            <li className="xun"><span className="xn">Unallocated</span><span className="xb" aria-hidden="true" /><span className="xv bw-mono">{Math.round(nm.unallocated)}%</span></li>
          )}
        </ul>
        <p className="bw-meta">Shares of your own weights, grouped by a fixed map of types to factors (listed under &ldquo;How it is worked out&rdquo;).</p>
      </div>
      <div>
        <h3 className="sub">Concentration</h3>
        <dl className="cfacts">
          <div><dt>Largest share</dt><dd className="bw-mono">{c.largest ? `${SHORT[c.largest.id]} ${Math.round(c.largest.share)}%` : "n/a"}</dd></div>
          <div><dt>Top two together</dt><dd className="bw-mono">{c.topTwo != null ? `${Math.round(c.topTwo)}%` : "n/a"}</dd></div>
          <div><dt>Types with a weight</dt><dd className="bw-mono">{c.count}</dd></div>
        </dl>
        <p className="note">{c.words} Shares here are of what you have allocated, so Unallocated is left out.</p>
        <p className="bw-disclaimer after-plot">Interpretation, not a forecast. These are facts about the spread of your weights; they say nothing about how the mix will behave.</p>
      </div>
    </div>
  );
}
