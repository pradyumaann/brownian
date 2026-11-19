/** The calm empty state for "I own nothing yet" (mode "none"): what Portfolio Lens does, in facts about the feature only.
 *  No example mix and no figures are shown in this mode. `full` gives the two-line explanation (Your day, the front page);
 *  otherwise one line names what the section shows for a mix. */
export function NoneNote({ full, line }: { full?: boolean; line?: string }) {
  if (full) {
    return (
      <div className="empty">
        <p>Portfolio Lens reads the day&apos;s index and market moves against a mix of holding types, each given a weight that stays on this device.</p>
        <p className="gap-top">For a mix, it shows the blended one-day move, how its daily changes moved with Nifty 50, the last 250 sessions beside Nifty 50 and the dated events the brief ties to each type. With nothing owned, no example mix and no figures are shown.</p>
      </div>
    );
  }
  return <p className="empty">{line}</p>;
}
