// Thin wrapper around the Flask API. Components never call fetch directly.

const request = async (path, params = null, signal = undefined) => {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`${path}${query}`, { signal });

  if (!res.ok) throw new Error(`Backend error ${res.status}`);

  const data = await res.json();
  // The backend reports some failures with a 200 and an `error` field.
  if (data?.error) throw new Error(data.error);
  return data;
};

/** Available NetCDF datasets, as `{ label, value }` pairs. */
export const fetchDatasets = (signal) => request('/api/datasets', null, signal);

/** Variables, global metadata and per-variable attributes of one dataset. */
export const fetchFeatures = (file, signal) =>
  request('/api/diversity-features', { file }, signal);

/** Mean / SD / observation grids for one variable at one time step. */
export const fetchMap = ({ file, feature, timeIndex }, signal) =>
  request('/api/diversity-map', { file, feature, timeIndex }, signal);

/** Quality-control table for one variable (dataset-wide when feature is empty). */
export const fetchQualityControl = ({ file, feature }, signal) =>
  request('/api/diversity-qc', feature ? { file, feature } : { file }, signal);

/**
 * A photograph of one taxon from the WoRMS photogallery, as
 * `{ available, url, title, author, description, licenseName, licenseUrl, pageUrl }`.
 * Routed through the backend because WoRMS serves its gallery as HTML pages,
 * which the browser may not read cross-origin.
 */
export const fetchSpeciesImage = (aphiaId, signal) =>
  request('/api/species-image', { aphiaId }, signal);
