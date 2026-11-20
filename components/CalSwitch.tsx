import Link from "next/link";

/** Phones only: the Calendar tab covers two views, so each starts with a switch between them. */
export function CalSwitch({ here }: { here: "macro" | "earnings" }) {
  return (
    <nav className="calsw" aria-label="Calendar views">
      <Link href="/macro/" aria-current={here === "macro" ? "page" : undefined}>Macro Watch</Link>
      <Link href="/earnings/" aria-current={here === "earnings" ? "page" : undefined}>Earnings Radar</Link>
    </nav>
  );
}
