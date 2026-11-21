/** The Brownian mark: three strands meeting in one stem. Drawn from the founder's logo as a vector with no background,
 *  so it takes the surrounding text colour (`currentColor`) and stays sharp at any size. Decorative: the wordmark beside
 *  it carries the name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="139 189 668 463" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"><path d="M473 242C471 251.2 467.4 281.8 461.1 297.3C454.8 312.9 445.2 325.2 435.2 335.3C425.2 345.4 415.9 351.9 401.1 357.7C386.4 363.5 364.4 364 346.7 370.4C329 376.8 310.5 382.4 295.2 395.8C279.9 409.2 263.8 432.1 255.1 450.6C246.4 469.2 246.9 487.1 242.9 507.1C238.9 527.1 237.9 553.9 231.2 570.8C224.5 587.7 207.4 602.3 202.7 608.6"/><path d="M473 242C475 251.2 478.6 281.8 484.9 297.3C491.2 312.9 500.8 325.2 510.8 335.3C520.8 345.4 530.1 351.9 544.9 357.7C559.6 363.5 581.6 364 599.3 370.4C617 376.8 635.5 382.4 650.8 395.8C666.1 409.2 682.2 432.1 690.9 450.6C699.6 469.2 699.1 487.1 703.1 507.1C707.1 527.1 708.1 553.9 714.8 570.8C721.5 587.7 738.5 602.3 743.3 608.6"/><path d="M473 207V617"/></g><g fill="currentColor"><circle cx="173" cy="617.0" r="35"/><circle cx="473" cy="617.0" r="35"/><circle cx="773" cy="617.0" r="35"/></g>
    </svg>
  );
}
