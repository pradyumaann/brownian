/** A view section: heading, a meta line (context at left, "NN · Feature" at right) and a rule. */
export function Section({ title, meta, ix, children, id }: {
  title: React.ReactNode; meta?: React.ReactNode; ix?: string; children: React.ReactNode; id?: string;
}) {
  return (
    <section className="sec" id={id}>
      <div className="sh">
        <h2>{title}</h2>
        <p className="bw-meta"><span>{meta}</span>{ix && <span className="ix">{ix}</span>}</p>
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

export const S = ({ children }: { children: React.ReactNode }) => <span className="bw-serif">{children}</span>;
