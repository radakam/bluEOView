import { useEffect, useState } from 'react';

const NARROW_BREAKPOINT = 900;

const isNarrowViewport = () =>
  typeof window !== 'undefined' && window.innerWidth < NARROW_BREAKPOINT;

/** True while the viewport is too narrow to show the panels side by side. */
export const useIsNarrow = () => {
  const [isNarrow, setIsNarrow] = useState(isNarrowViewport);

  useEffect(() => {
    const onResize = () => setIsNarrow(isNarrowViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isNarrow;
};
