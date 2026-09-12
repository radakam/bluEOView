import { useEffect, useRef, useState } from 'react';

/**
 * Runs an async task whenever `deps` change and tracks its loading/error state.
 *
 * The task receives an AbortSignal; results of a run that has been superseded
 * (or unmounted) are discarded, so out-of-order responses cannot overwrite
 * newer data.
 *
 * @param task        (signal) => Promise<data>
 * @param deps        values that should trigger a re-run
 * @param enabled     skip the run entirely while false (e.g. missing arguments)
 * @param initialData value to start from, and to fall back to when `reset`
 * @param reset       clear data at the start of every run instead of keeping
 *                    the previous result visible while the next one loads
 */
export const useAsyncData = (
  task,
  deps,
  { enabled = true, initialData = null, reset = false } = {}
) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Kept in refs so a task closure or a fresh object literal does not re-run the effect.
  const taskRef = useRef(task);
  taskRef.current = task;
  const initialDataRef = useRef(initialData);

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    if (reset) setData(initialDataRef.current);
    setError(null);
    setLoading(true);

    taskRef
      .current(signal)
      .then((result) => { if (!signal.aborted) setData(result); })
      .catch((err) => {
        if (signal.aborted || err.name === 'AbortError') return;
        setError(err.message);
        if (reset) setData(initialDataRef.current);
      })
      .finally(() => { if (!signal.aborted) setLoading(false); });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reset, ...deps]);

  return { data, loading, error };
};
