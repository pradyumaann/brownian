// Per-viewer state lives on this device only (keys carry the prototype's "ii:" prefix), always inside try/catch.
export const store = {
  get<T>(k: string): T | null { try { const v = localStorage.getItem("ii:" + k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } },
  set(k: string, v: unknown) { try { localStorage.setItem("ii:" + k, JSON.stringify(v)); } catch {} },
  del(k: string) { try { localStorage.removeItem("ii:" + k); } catch {} },
};
