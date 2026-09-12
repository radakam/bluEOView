import { fetchDatasets } from '../api/client';
import { useAsyncData } from './useAsyncData';

const EMPTY = [];

/** The NetCDF datasets the backend found in its data directory. */
export const useDatasets = () => {
  const { data, loading, error } = useAsyncData(
    async (signal) => {
      const datasets = await fetchDatasets(signal);
      if (!datasets?.length) {
        throw new Error('No NetCDF datasets (.nc) found in the target directory.');
      }
      return datasets;
    },
    [],
    { initialData: EMPTY }
  );

  return { datasets: data ?? EMPTY, loading, error };
};
