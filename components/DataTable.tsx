type Head = [string, ("r" | "")?];

/** Hairline table. `stack` turns rows into cards under 620px so phones never scroll sideways. */
export function DataTable({ head, rows, stack = false, label }: {
  head: Head[]; rows: React.ReactNode[][]; stack?: boolean; label?: string;
}) {
  return (
    <div className="tbl-wrap">
      <table className={`bw-table${stack ? " st" : ""}`} aria-label={label}>
        <thead>
          <tr>{head.map(([h, a], i) => <th key={i} className={a || undefined} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={head[j]?.[1] || undefined} data-l={head[j]?.[0] || undefined}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
