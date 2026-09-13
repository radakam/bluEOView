import { fetchMap } from '../api/client';
import { useAsyncData } from './useAsyncData';

/** SD grid as a percentage of its global maximum, so the scale is stable across months. */
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
  // Keeps the previous grids visible while the next ones load, to avoid flicker.
  const { data, loading, error } = useAsyncData(
    async (signal) => normalise(await fetchMap({ file, feature, timeIndex }, signal)),
    [file, feature, timeIndex],
    { enabled: Boolean(file && feature) }
  );

  return { mapData: data, loading, error };
};
