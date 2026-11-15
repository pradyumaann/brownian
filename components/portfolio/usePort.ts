"use client";
import { useEffect, useState } from "react";
import { B } from "@/data";
import { equalWeights, HOLDING_IDS, STEP, stepWeight, type Weights } from "@/lib/portfolioMath";
import { store } from "./store";

/** example: nothing stored, the example mix is shown. migrated: built from the older `ii:held2` picks, not yet saved.
 *  saved: the viewer's own weights in `ii:port3` (`{ v: 1, w: { [holdingId]: percent } }`). */
export type Mode = "example" | "migrated" | "saved";

/** Weights from storage, keeping only known holding ids and whole 5% steps within 0-100. */
function sanitise(raw: unknown): Weights {
  const out: Weights = {};
  if (raw && typeof raw === "object") {
    for (const id of HOLDING_IDS) {
      const n = Number((raw as Record<string, unknown>)[id]);
      if (Number.isFinite(n) && n > 0) out[id] = Math.min(100, Math.max(STEP, Math.round(n / STEP) * STEP));
    }
  }
  return out;
}

const EXAMPLE = equalWeights(B.defaultHold);

/** The viewer's mix: weights per holding type, kept on this device. `ii:watch2` is untouched. */
export function usePort() {
  const [w, setW] = useState<Weights>(EXAMPLE);
  const [mode, setMode] = useState<Mode>("example");
  const [ready, setReady] = useState(false);
  const [undo, setUndo] = useState<{ w: Weights; mode: Mode } | null>(null);

  useEffect(() => {
    const s = store.get<{ v?: number; w?: unknown }>("port3");
    if (s && s.v === 1) { setW(sanitise(s.w)); setMode("saved"); }
    else {
      const held = store.get<unknown>("held2");
      if (Array.isArray(held)) { setW(equalWeights(held.filter((x): x is string => typeof x === "string"))); setMode("migrated"); }
    }
    setReady(true);
  }, []);

  const save = (n: Weights) => { setW(n); setMode("saved"); store.set("port3", { v: 1, w: n }); };
  return {
    w, mode, ready, undo,
    step: (id: string, dir: 1 | -1) => { setUndo(null); save(stepWeight(w, id, dir)); },
    zero: (id: string) => { setUndo(null); const n = { ...w }; delete n[id]; save(n); },
    equal: () => { setUndo({ w, mode }); save(equalWeights(Object.keys(w))); },
    reset: () => { setUndo({ w, mode }); setW(EXAMPLE); setMode("example"); store.del("port3"); store.del("held2"); },
    restore: () => {
      if (!undo) return;
      if (undo.mode === "saved") save(undo.w);
      else { setW(undo.w); setMode(undo.mode); if (undo.mode === "example") { store.del("port3"); } }
      setUndo(null);
    },
  };
}
