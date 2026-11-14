// Small, dependency-free statistics for the indexes. Every function takes plain arrays and returns plain numbers.

/** Share of `history` values at or below `x`, as 0–100. The empirical percentile used to score components. */
export function percentile(history: number[], x: number): number {
  if (!history.length) return NaN;
  let below = 0, equal = 0;
  for (const v of history) { if (v < x) below++; else if (v === x) equal++; }
  return ((below + equal / 2) / history.length) * 100;
}

export const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;

/** Simple returns between consecutive values. */
export const returns = (a: number[]) => a.slice(1).map((v, i) => v / a[i] - 1);

/** Covariance matrix of the columns of `rows` (observations × variables), with column means. */
export function covariance(rows: number[][]): { mu: number[]; cov: number[][] } {
  const n = rows.length, k = rows[0].length;
  const mu = Array.from({ length: k }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / n);
  const cov = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const r of rows) for (let i = 0; i < k; i++) for (let j = i; j < k; j++) cov[i][j] += (r[i] - mu[i]) * (r[j] - mu[j]);
  for (let i = 0; i < k; i++) for (let j = i; j < k; j++) { cov[i][j] /= n - 1; cov[j][i] = cov[i][j]; }
  return { mu, cov };
}

/** Inverse of a symmetric positive-definite matrix by Gauss–Jordan elimination with partial pivoting. */
export function invert(m: number[][]): number[][] {
  const k = m.length, a = m.map((r, i) => [...r, ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < k; c++) {
    let p = c;
    for (let r = c + 1; r < k; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    [a[c], a[p]] = [a[p], a[c]];
    const d = a[c][c];
    if (Math.abs(d) < 1e-18) throw new Error("singular covariance matrix");
    for (let j = 0; j < 2 * k; j++) a[c][j] /= d;
    for (let r = 0; r < k; r++) if (r !== c) { const f = a[r][c]; if (f) for (let j = 0; j < 2 * k; j++) a[r][j] -= f * a[c][j]; }
  }
  return a.map((r) => r.slice(k));
}

/** Eigenvalues of a symmetric matrix (cyclic Jacobi), largest first. */
export function eigenvalues(m: number[][]): number[] {
  const k = m.length, a = m.map((r) => [...r]);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) off += a[i][j] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < k; p++) for (let q = p + 1; q < k; q++) {
      if (Math.abs(a[p][q]) < 1e-30) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let r = 0; r < k; r++) {
        const arp = a[r][p], arq = a[r][q];
        a[r][p] = c * arp - s * arq; a[r][q] = s * arp + c * arq;
      }
      for (let r = 0; r < k; r++) {
        const apr = a[p][r], aqr = a[q][r];
        a[p][r] = c * apr - s * aqr; a[q][r] = s * apr + c * aqr;
      }
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => y - x);
}

/** (x − μ)ᵀ Σ⁻¹ (x − μ): the squared Mahalanobis distance. */
export function mahalanobis2(x: number[], mu: number[], inv: number[][]): number {
  const d = x.map((v, i) => v - mu[i]);
  let s = 0;
  for (let i = 0; i < d.length; i++) for (let j = 0; j < d.length; j++) s += d[i] * inv[i][j] * d[j];
  return s;
}
