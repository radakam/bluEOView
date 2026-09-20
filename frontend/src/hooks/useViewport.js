import { useEffect, useState } from 'react';
import { useElementSize } from './useElementSize';

/** Matches MUI's `sm`, so the JS and the `sx` breakpoints agree on what a phone is. */
const PHONE_BREAKPOINT = 600;

/** Narrower than this, a figure is cramped: labels crowd, the title wraps into the map. */
const MIN_FIGURE_WIDTH = 560;

/** Gap between figures sharing a row, from `panelRowStyle`. */
const FIGURE_GAP = 8;

const isBelow = (breakpoint) =>
  typeof window !== 'undefined' && window.innerWidth < breakpoint;

/** True on a phone, where the controls take their compact form. */
export const useIsPhone = () => {
  const [below, setBelow] = useState(() => isBelow(PHONE_BREAKPOINT));

  useEffect(() => {
    const update = () => setBelow(isBelow(PHONE_BREAKPOINT));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return below;
};

/**
 * How `count` figures should share their row, from the width the row actually
 * has. Returns `[ref, { stacked, compact }]`; attach the ref to the row. It is
 * `stacked` when they would be too narrow side by side, `compact` when even a
 * stacked figure still is.
 */
export const useFigureRow = (count) => {
  const [ref, { width }] = useElementSize();

  const figures = Math.max(count, 1);
  const stacked = width > 0 && width < figures * MIN_FIGURE_WIDTH;
  const figureWidth = stacked ? width : (width - FIGURE_GAP * (figures - 1)) / figures;

  return [ref, { stacked, compact: figureWidth > 0 && figureWidth < MIN_FIGURE_WIDTH }];
};
