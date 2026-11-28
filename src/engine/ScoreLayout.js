export function scorePage({ width, indent, barSteps, bars, anchorStep, follow = false }) {
  const usable = Math.max(barSteps, width - indent);
  const barsPerPage = Math.max(1, Math.min(bars, Math.floor(usable / (barSteps * 22))));
  const pageCount = Math.ceil(bars / barsPerPage);
  const page = Math.max(0, Math.min(pageCount - 1, Math.floor(anchorStep / (barsPerPage * barSteps))));
  const steps = Math.min(barsPerPage, bars) * barSteps;
  const stepWidth = Math.min(56, usable / (barsPerPage * barSteps));
  if (follow) {
    // Keep the playhead about a third of the way across the viewport so there
    // is always time to read the upcoming notes, lyrics and chord changes.
    const maxStart = Math.max(0, bars * barSteps - steps);
    const start = Math.max(0, Math.min(maxStart, anchorStep - steps * 0.3));
    const firstBar = Math.floor(start / barSteps);
    const visibleBars = Math.min(bars - firstBar, Math.ceil((start + steps) / barSteps) - firstBar);
    return { page, pageCount, firstBar, barsPerPage, visibleBars, start, steps, stepWidth };
  }
  const firstBar = page * barsPerPage;
  const visibleBars = Math.min(barsPerPage, bars - firstBar);
  return { page, pageCount, firstBar, barsPerPage, visibleBars, start: firstBar * barSteps,
    steps: visibleBars * barSteps, stepWidth };
}
