/** A view section: heading, a meta line (context at left, "NN · Feature" at right) and a rule. */
export function Section({ title, meta, ix, children, id, interp }: {
  title: React.ReactNode; meta?: React.ReactNode; ix?: string; children: React.ReactNode; id?: string;
  /** Phones only: "Interpretation, not a forecast." once in the meta line, in place of the per-tile copies (`.ifw`). */
  interp?: boolean;
}) {
  return (
    <section className="sec" id={id}>
      <div className="sh">
        <h2>{title}</h2>
        <p className="bw-meta"><span>{meta}{interp && <span className="ifp"> · Interpretation, not a forecast.</span>}</span>{ix && <span className="ix">{ix}</span>}</p>
        <hr className="bw-rule" />
      </div>
      {children}
    </section>
  );
}

/** View header: the one display line with its serif word, a lede, and the feature name. */
export function ViewHead({ title, lede, feature }: { title: React.ReactNode; lede: React.ReactNode; feature: string }) {
  return (
    <header className="vh">
      <h1>{title}</h1>
      <div>
        <p className="lede">{lede}</p>
        <p className="bw-source vh-f">{feature}</p>
      </div>
    </header>
  );
}

/** Kept so headings read as plain text; the old serif-italic accent word was removed on 14 Nov 2026. */
export const S = ({ children }: { children: React.ReactNode }) => <>{children}</>;
