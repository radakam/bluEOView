import { fetchSpeciesImage } from '../api/client';
import { useAsyncData } from './useAsyncData';

/** Photograph of one taxon, or null while it loads, if there is none, or if the lookup fails. */
export const useSpeciesImage = (aphiaId) => {
  const { data } = useAsyncData(
    (signal) => fetchSpeciesImage(aphiaId, signal),
    [aphiaId],
    { enabled: Boolean(aphiaId), initialData: null, reset: true }
  );

  return aphiaId && data?.available ? data : null;
};
