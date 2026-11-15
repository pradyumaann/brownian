"use client";
import { HOLDING_IDS, STEP, type Weights, normalise } from "@/lib/portfolioMath";
import type { TypeFact } from "@/lib/portfolioTypes";
import { Chip } from "../Chip";
import type { Mode, usePort } from "./usePort";

type Port = ReturnType<typeof usePort>;

/** A weight stepper: tap the buttons, or focus the value and use the arrow keys (up/right more, down/left less, Home zero). */
function Stepper({ id, name, value, onStep, onZero }: { id: string; name: string; value: number; onStep: (d: 1 | -1) => void; onZero: () => void }) {
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); onStep(1); }
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); onStep(-1); }
    else if (e.key === "Home") { e.preventDefault(); onZero(); }
  };
  return (
    <div className="stp" role="group" aria-label={`Weight of ${name}`}>
      <button type="button" className="stp-b" aria-label={`${STEP}% less in ${name}`} aria-disabled={value <= 0} onClick={() => value > 0 && onStep(-1)}>−</button>
      <span id={`w-${id}`} className="stp-v bw-mono" role="spinbutton" tabIndex={0} aria-label={`${name} weight`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}
        aria-valuetext={`${value} percent`} onKeyDown={key}>{value}%</span>
      <button type="button" className="stp-b" aria-label={`${STEP}% more in ${name}`} aria-disabled={value >= 100} onClick={() => value < 100 && onStep(1)}>+</button>
    </div>
  );
}

const NOTE: Record<Mode, string> = {
  example: "Example mix. Weights you set stay on this device.",
  migrated: "Carried over from your earlier picks as equal weights. Change any weight to save it on this device.",
  saved: "Saved on this device only. Nothing is sent anywhere.",
};

/** Your mix: a weight per holding type in 5% steps, the total and what is left Unallocated. */
export function Mix({ port, facts }: { port: Port; facts: TypeFact[] }) {
  const { w, mode, undo } = port;
  const nm = normalise(w as Weights);
  const picked = Object.keys(nm.shares).length;
  return (
    <>
      <p className="bw-meta mix-note">{mode === "example" && <><Chip>Example</Chip> </>}{NOTE[mode]}</p>
      <ul className="mixlist">
        {HOLDING_IDS.map((id) => {
          const f = facts.find((x) => x.id === id)!, v = w[id] || 0;
          return (
            <li key={id} className="mixrow">
              <span className="mix-n">{f.n}</span>
              <Stepper id={id} name={f.n} value={v} onStep={(d) => port.step(id, d)} onZero={() => port.zero(id)} />
              <span className="mix-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, v)}%` }} /></span>
            </li>
          );
        })}
      </ul>
      <p className="mix-total" aria-live="polite">
        <span>Total <b className="bw-mono">{nm.total}%</b></span>{" "}
        {nm.over
          ? <span>Over 100%: shares are scaled to 100% for the calculation (each weight × {(nm.scale).toFixed(2)}).</span>
          : <span>Unallocated <b className="bw-mono">{nm.unallocated}%</b></span>}
      </p>
      <div className="mix-actions">
        <button type="button" className="bw-btn" onClick={port.equal} disabled={!picked}>Equal weight my picks <span className="bw-btn-dot" aria-hidden="true">=</span></button>
        <button type="button" className="linkbtn" onClick={port.reset}>Reset to the example</button>
        {undo && <button type="button" className="linkbtn" onClick={port.restore}>Undo</button>}
      </div>
      <p className="bw-meta">Your wallet is not a holding and has no weight; it is a separate note below.</p>
    </>
  );
}
