export function scorePage({ width, indent, barSteps, bars, anchorStep }) {
  const usable = Math.max(barSteps, width - indent);
  const barsPerPage = Math.max(1, Math.min(bars, Math.floor(usable / (barSteps * 22))));
  const pageCount = Math.ceil(bars / barsPerPage);
  const page = Math.max(0, Math.min(pageCount - 1, Math.floor(anchorStep / (barsPerPage * barSteps))));
  const firstBar = page * barsPerPage;
  const visibleBars = Math.min(barsPerPage, bars - firstBar);
  const steps = visibleBars * barSteps;
  return { page, pageCount, firstBar, barsPerPage, visibleBars, start: firstBar * barSteps,
    steps, stepWidth: Math.min(56, usable / (barsPerPage * barSteps)) };
}
