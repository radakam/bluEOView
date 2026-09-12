import { useEffect, useRef, useState } from 'react';

/**
 * Tracks the rendered size of an element.
 * Returns `[ref, { width, height }]`; attach the ref to the element to measure.
 */
export const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const measure = () =>
      setSize(({ width, height }) =>
        width === element.offsetWidth && height === element.offsetHeight
          ? { width, height } // same size: keep the object identity stable
          : { width: element.offsetWidth, height: element.offsetHeight }
      );

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
};
