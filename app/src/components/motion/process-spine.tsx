/**
 * The hairline that runs down the method steps and draws itself as the section
 * scrolls past.
 *
 * ── WHY THIS IS A SERVER COMPONENT WITH NO JAVASCRIPT ──
 * The whole effect is one `stroke-dashoffset` on a CSS view-progress timeline.
 * Nothing here reads the scroll position, so there is no observer, no rAF and
 * no client bundle. Without CSS scroll-timeline support, without JavaScript,
 * and with the site's motion switch on, the line is simply already drawn, which
 * is a finished design rather than a degraded one.
 *
 * ── DIRECTION ──
 * Placed with logical properties only, so it lands on the RIGHT in Hebrew and
 * would land on the left in an LTR locale with no override. The beads are
 * circles, which have no direction at all.
 *
 * ⚠️ IT ONLY EXISTS WHILE THE STEPS ARE A COLUMN. The line threads one bead per
 * step down its length, which is a drawing of "these things happen in this
 * order". From the breakpoint where the grid becomes a row, the steps run
 * across the page while the spine still runs down its edge, so it would be a
 * lone vertical line whose beads connect nothing. It is hidden there instead.
 * If the grid's breakpoints change, this changes with them.
 */
export function ProcessSpine({ steps }: { steps: number }) {
  return (
    <svg
      aria-hidden
      className="process-spine"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 4 100"
    >
      <line
        className="process-spine__track"
        x1="2"
        x2="2"
        y1="0"
        y2="100"
      />
      <line
        className="process-spine__draw"
        pathLength={1}
        x1="2"
        x2="2"
        y1="0"
        y2="100"
      />
      {Array.from({ length: steps }).map((_, index) => (
        <circle
          className="process-spine__bead"
          cx="2"
          cy={((index + 0.5) / steps) * 100}
          key={index}
          r="1.6"
        />
      ))}
    </svg>
  );
}
