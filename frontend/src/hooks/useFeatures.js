import { fetchFeatures } from '../api/client';
import { useAsyncData } from './useAsyncData';

const EMPTY_RESULT = { features: [], metadata: {}, timeLongName: null, varInfo: null };

const titleCase = (name) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const toOption = (feature) => ({
  label: feature.label ?? titleCase(feature.value),
  value: feature.value ?? feature,
  target_id: feature.target_id ?? null,
  standard_name: feature.standard_name ?? null,
  long_name: feature.long_name ?? null,
});

/** Variables, metadata and per-variable attributes of the dataset at `fileUrl`. */
export const useFeatures = (fileUrl) => {
  const { data, loading, error } = useAsyncData(
    async (signal) => {
      const response = await fetchFeatures(fileUrl, signal);
      if (!response.features?.length) {
        throw new Error('No valid features found in this dataset.');
      }
      return {
        features: response.features.map(toOption),
        metadata: response.metadata ?? {},
        timeLongName: response.timeLongName ?? null,
        varInfo: response.varInfo ?? null,
      };
    },
    [fileUrl],
    { enabled: Boolean(fileUrl), initialData: EMPTY_RESULT, reset: true }
  );

  const result = data ?? EMPTY_RESULT;
  return {
    ...result,
    loading,
    error: error && `Failed to load dataset: ${error}`,
  };
};
