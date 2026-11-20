import { B } from "@/data";
import { glanceLines } from "@/lib/glance";
import { Src } from "./Src";

/** "Today in 3 lines": the first block on Markets, Overnight, on every screen size, the same for every reader.
 *  Facts in plain words; every figure templated from the day's record (lib/glance.ts), one tag group per line. */
export function Glance() {
  const lines = glanceLines({ session: B.session, india: B.india, gift: B.kpis.gift, next: B.next, glance: B.glance });
  return (
    <section className="glance" aria-labelledby="glance-h">
      <div className="sh">
        <h2 id="glance-h">Today in 3 lines</h2>
        <p className="bw-meta"><span>{B.session} session, overnight and what is scheduled</span></p>
        <hr className="bw-rule" />
      </div>
      <ol className="glance-l">
        {lines.map((l) => (
          <li key={l.text}><p><span className="glance-t">{l.text}</span><Src k={l.src} /></p></li>
        ))}
      </ol>
    </section>
  );
}
