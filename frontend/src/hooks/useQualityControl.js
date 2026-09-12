import { fetchQualityControl } from '../api/client';
import { useAsyncData } from './useAsyncData';

/** Quality-control table for one variable of the dataset at `file`. */
export const useQualityControl = ({ file, feature }) => {
  const { data, loading, error } = useAsyncData(
    (signal) => fetchQualityControl({ file, feature }, signal),
    [file, feature],
    { enabled: Boolean(file), reset: true }
  );

  return { qualityControl: data, loading, error };
};
