"use client";
import { useEffect, useState } from "react";
import { B } from "@/data";
import { equalWeights, NONE_RECORD, readPort3, savedRecord, stepWeight, type Mode, type Weights } from "@/lib/portfolioMath";
import { store } from "./store";

/** example | migrated | saved | none: see `Mode` in lib/portfolioMath.ts. Read `mode` from `usePort()` to tell them apart
 *  (a front-page card can show its own empty state when it is "none"). */
export type { Mode };

const EXAMPLE = equalWeights(B.defaultHold);

/** The viewer's mix: weights per holding type, kept on this device. `ii:watch2` is untouched. */
export function usePort() {
  const [w, setW] = useState<Weights>(EXAMPLE);
  const [mode, setMode] = useState<Mode>("example");
  const [ready, setReady] = useState(false);
  const [undo, setUndo] = useState<{ w: Weights; mode: Mode } | null>(null);

  useEffect(() => {
    const s = readPort3(store.get<unknown>("port3"));
    if (s) { setW(s.w); setMode(s.mode); }
    else {
      const held = store.get<unknown>("held2");
      if (Array.isArray(held)) { setW(equalWeights(held.filter((x): x is string => typeof x === "string"))); setMode("migrated"); }
    }
    setReady(true);
  }, []);

  // Saving writes `{ v: 1, w }` without `none`, so any saved weight leaves none mode.
  const save = (n: Weights) => { setW(n); setMode("saved"); store.set("port3", savedRecord(n)); };
  const setNone = () => { setW({}); setMode("none"); store.set("port3", NONE_RECORD); };
  return {
    w, mode, ready, undo,
    step: (id: string, dir: 1 | -1) => { setUndo(null); save(stepWeight(w, id, dir)); },
    zero: (id: string) => { setUndo(null); const n = { ...w }; delete n[id]; save(n); },
    equal: () => { setUndo({ w, mode }); save(equalWeights(Object.keys(w))); },
    /** Back to the example mix. */
    reset: () => { setUndo({ w, mode }); setW(EXAMPLE); setMode("example"); store.del("port3"); store.del("held2"); },
    /** A saved mix with no weights, to set from zero. */
    empty: () => { setUndo({ w, mode }); save({}); },
    /** "I own nothing yet": no example and no figures; kept as `{ v: 1, w: {}, none: true }`. `ii:held2` is kept so Undo
     *  back to carried-over picks still works after a reload. */
    none: () => { setUndo({ w, mode }); setNone(); },
    restore: () => {
      if (!undo) return;
      if (undo.mode === "saved") save(undo.w);
      else if (undo.mode === "none") setNone();
      else { setW(undo.w); setMode(undo.mode); store.del("port3"); }
      setUndo(null);
    },
  };
}
