import { fetchMap } from '../api/client';
import { useAsyncData } from './useAsyncData';

/**
 * Rescale the SD grid to a percentage of the variable's global SD maximum, so
 * the SD colour scale means the same thing across time steps.
 */
const toPercentOfMax = (grid, globalMax) => {
  if (!(globalMax > 0) || !grid?.length) return grid ?? [];
  return grid.map((row) =>
    row.map((v) => (v === null ? null : Math.round((v / globalMax) * 1000) / 10))
  );
};

const normalise = (json) => ({
  lats: json.lats ?? [],
  lons: json.lons ?? [],
  mean: json.mean ?? [],
  sdPct: toPercentOfMax(json.sd, json.sdGlobalMax ?? json.sdMax ?? null),
  obs: json.obs ?? [],
  obsMax: json.obsMax ?? null,
  obsType: json.obsType ?? null,
  hasObs: json.hasObs ?? false,
  minValue: json.minValue ?? null,
  maxValue: json.maxValue ?? null,
});

/** Mean / SD / observation grids for one variable at one time step. */
export const useMapData = ({ file, feature, timeIndex }) => {
  // The previous grids stay on screen (behind a loading overlay) while the next
  // ones are fetched, so the figure does not blink on every slider step.
  const { data, loading, error } = useAsyncData(
    async (signal) => normalise(await fetchMap({ file, feature, timeIndex }, signal)),
    [file, feature, timeIndex],
    { enabled: Boolean(file && feature) }
  );

  return { mapData: data, loading, error };
};
