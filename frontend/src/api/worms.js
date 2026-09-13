// World Register of Marine Species (WoRMS), queried directly from the browser.
//
// Only the REST API sends CORS headers, and it covers taxonomy alone.
// Photographs live on WoRMS' HTML pages and are read server-side instead —
// see `fetchSpeciesImage` in `api/client.js`.

const REST_BASE = 'https://www.marinespecies.org/rest';

/** Public taxon page for an AphiaID. */
export const wormsTaxonUrl = (aphiaId) =>
  `https://www.marinespecies.org/aphia.php?p=taxdetails&id=${aphiaId}`;

/**
 * Classification of a taxon, flattened from the nested `child` chain WoRMS
 * returns into an ordered list from kingdom down to the taxon itself.
 */
export const fetchWormsClassification = async (aphiaId, signal) => {
  const res = await fetch(`${REST_BASE}/AphiaClassificationByAphiaID/${aphiaId}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`Registry returned status code: ${res.status}`);

  const data = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Taxon details or classification not found in WoRMS registry.');
  }

  const ranks = [];
  for (let node = data; node?.rank; node = node.child) {
    ranks.push({ rank: node.rank, scientificname: node.scientificname });
  }
  return ranks;
};
