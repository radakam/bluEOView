"""Loading and caching of the NetCDF projections.

A dataset is opened once per URL and kept in memory as an "entry": the xarray
dataset plus the derived information the API needs (valid targets, grid,
metadata and the lazily computed maxima used for colour scaling).
"""

import logging
from collections import defaultdict
from threading import Lock, Thread

import numpy as np
import xarray as xr

from storage import get_local_path

log = logging.getLogger(__name__)

_datasets = {}
_datasets_lock = Lock()  # protects _datasets only, so lookups stay fast

# One lock per URL, so loading different files does not serialise.
_url_locks = defaultdict(Lock)
_url_locks_guard = Lock()

# Global attributes worth surfacing, and the attribute names they may appear under.
METADATA_FIELDS = {
    "title": ["title"],
    "summary": ["summary", "abstract"],
    "institution": ["institution", "university", "affiliation", "source_institution"],
    "paper": ["paper", "publication", "reference", "references", "doi", "citation"],
    "doi": ["doi"],
    "author": ["author", "creator_name", "contact"],
    "license": ["license", "licence"],
    "version": ["version", "data_version"],
    "date_created": ["date_created", "creation_date"],
    "history": ["history"],
    "source": ["source"],
    "description": ["description", "global:description"],
    "comment": ["comment", "notes"],
    "keywords": ["keywords"],
    "project": ["project", "program"],
    "geospatial_lat_min": ["geospatial_lat_min"],
    "geospatial_lat_max": ["geospatial_lat_max"],
    "geospatial_lon_min": ["geospatial_lon_min"],
    "geospatial_lon_max": ["geospatial_lon_max"],
    "time_coverage_start": ["time_coverage_start"],
    "time_coverage_end": ["time_coverage_end"],
}


# --- small helpers --------------------------------------------------------

def decode_str(value):
    """NetCDF strings arrive as bytes or numpy scalars; normalise them to str."""
    if isinstance(value, (bytes, np.bytes_)):
        return value.decode("utf-8", errors="replace").strip()
    return str(value).strip()


def slice_to_2d(da):
    """A (lat, lon) slice as nested lists, with non-finite values as None."""
    arr = da.transpose("lat", "lon").values.astype(np.float64)
    return [[None if not np.isfinite(v) else round(float(v), 3) for v in row] for row in arr]


def drop_time(da, time_index):
    return da.isel(time=time_index) if "time" in da.dims else da


def extract_metadata(ds):
    """Global attributes, mapped onto canonical names; the rest go to `extra_attributes`."""
    attrs = ds.attrs
    meta = {}
    captured = set()

    for canonical, candidates in METADATA_FIELDS.items():
        for candidate in candidates:
            value = (
                attrs.get(candidate)
                or attrs.get(candidate.upper())
                or attrs.get(candidate.lower())
            )
            if value is not None:
                meta[canonical] = str(value).strip()
                captured.add(candidate.lower())
                break

    extra = {k: str(v).strip() for k, v in attrs.items() if k.lower() not in captured}
    if extra:
        meta["extra_attributes"] = extra
    return meta


def variable_info(ds, var_name):
    """Standard name, long name and unit of one variable, for the figure subtitles."""
    if var_name not in ds:
        return {"standard_name": None, "long_name": None, "unit": None}

    attrs = ds[var_name].attrs
    unit = next((decode_str(attrs[key]) for key in ("unit", "units") if key in attrs), None)
    return {
        "standard_name": decode_str(attrs["standard_name"]) if "standard_name" in attrs else None,
        "long_name": decode_str(attrs["long_name"]) if "long_name" in attrs else None,
        "unit": unit,
    }


def detect_obs_type(ds):
    """Whether observations are presence/absence ("diversity") or counts ("taxa").

    Decided from a single slice: a few thousand finite values are plenty, and
    loading the whole observation cube would be far too slow.
    """
    if "obs" not in ds:
        return None

    obs = ds["obs"]
    try:
        sample = obs.isel({d: 0 for d in obs.dims if d not in ("lat", "lon")})
        values = sample.values.astype(np.float64).ravel()
    except Exception:
        values = obs.values.ravel()[:10000].astype(np.float64)

    finite = values[np.isfinite(values)]
    if finite.size == 0:
        return None

    unique = np.unique(finite)
    is_binary = unique.size <= 2 and np.all(np.isin(unique, [0.0, 1.0]))
    return "diversity" if is_binary else "taxa"


# --- dataset loading ------------------------------------------------------

def _open(local_path):
    """Open with h5netcdf, falling back to the default engine and to raw times."""
    try:
        return xr.open_dataset(local_path, engine="h5netcdf", mask_and_scale=True, chunks={})
    except Exception:
        try:
            return xr.open_dataset(local_path, mask_and_scale=True, chunks={})
        except Exception:
            return xr.open_dataset(
                local_path, mask_and_scale=True, chunks={}, decode_times=False
            )


def _normalise_target_naming(ds):
    """Rename the legacy species/taxa naming to the current target naming."""
    for old_var, new_var, old_dim, new_dim in (
        ("species_name", "taxa_name", "species", "taxa"),
        ("taxa_name", "target_name", "taxa", "target"),
    ):
        rename = {}
        if old_var in ds and new_var not in ds:
            rename[old_var] = new_var
        if old_dim in ds.dims and new_dim not in ds.dims:
            rename[old_dim] = new_dim
        if rename:
            ds = ds.rename(rename)
    return ds


def _read_grid(ds, local_path):
    """Latitude and longitude of the grid, falling back to an even grid."""
    try:
        # Read undecoded, so fill values stay recognisable rather than becoming NaN.
        with xr.open_dataset(local_path, decode_cf=False) as raw:
            raw_lats = np.array(raw["lat"].values, dtype=float).flatten()
            raw_lons = np.array(raw["lon"].values, dtype=float).flatten()

        lats = sorted(
            round(float(v), 4) for v in raw_lats if np.isfinite(v) and -90 <= v <= 90
        )
        lons = sorted(
            round(float(v), 4) for v in raw_lons if np.isfinite(v) and -180 <= v <= 360
        )
        if not lats or not lons:
            raise ValueError("lat/lon contain only fill values")
        return lats, lons
    except Exception as e:
        log.warning("Coord extraction failed (%s), inferring from dim size", e)
        n_lat = ds.sizes.get("lat", 180)
        n_lon = ds.sizes.get("lon", 360)
        return (
            [round(-90 + (i + 0.5) * 180 / n_lat, 4) for i in range(n_lat)],
            [round(-180 + (i + 0.5) * 360 / n_lon, 4) for i in range(n_lon)],
        )


def _valid_target_indices(ds):
    """Targets with at least one finite mean at the first time step.

    This loads a single (target, lat, lon) slice rather than the whole cube.
    """
    mean_da = ds["mean"]
    if "time" in mean_da.dims:
        mean_da = mean_da.isel(time=0)

    # Transpose so target leads, whatever order the file stores.
    mean_t0 = mean_da.transpose("target", ...).values
    n_targets = ds.sizes["target"]
    valid = np.isfinite(mean_t0).reshape(n_targets, -1).any(axis=1)
    return [int(i) for i, ok in enumerate(valid) if ok]


def _read_worms_ids(ds):
    """WoRMS AphiaIDs from `target_id`, as ints where possible."""
    values = None
    if "target_id" in ds:
        values = ds["target_id"].values.tolist()
    elif "target_id" in ds.coords:
        values = ds.coords["target_id"].values.tolist()

    if values is None:
        return None
    try:
        return [int(v) for v in values]
    except (TypeError, ValueError):
        return [str(v) for v in values]


def _url_lock(file_url):
    with _url_locks_guard:
        return _url_locks[file_url]


def get_dataset(file_url):
    """The cached entry for `file_url`, loading and preparing it on first use."""
    with _datasets_lock:
        cached = _datasets.get(file_url)
    if cached is not None:
        return cached

    # Serialise per URL, so two requests for the same file do not both load it.
    with _url_lock(file_url):
        with _datasets_lock:
            cached = _datasets.get(file_url)
        if cached is not None:
            return cached

        entry = _load_dataset(file_url)

        with _datasets_lock:
            _datasets[file_url] = entry

        # Warm the per-target SD maxima so the first map request is fast. A request
        # that beats the warmer computes its own target and the warmer skips it.
        Thread(
            target=_warm_sd_max,
            args=(file_url,),
            daemon=True,
            name=f"sd-warm-{file_url[-8:]}",
        ).start()

        return entry


def _load_dataset(file_url):
    local_path = get_local_path(file_url)
    log.info("Opening dataset: %s", local_path)

    ds = _open(local_path)
    log.info("Data vars: %s, dims: %s", list(ds.data_vars), dict(ds.sizes))

    ds = _normalise_target_naming(ds)

    name_var = next((v for v in ("target_name", "taxa_name") if v in ds), None)
    if name_var is None:
        raise ValueError("Dataset has neither 'target_name' nor 'taxa_name'")
    raw_names = [decode_str(n) for n in ds[name_var].values.tolist()]

    metadata = extract_metadata(ds)
    lats, lons = _read_grid(ds, local_path)

    has_obs = "obs" in ds
    obs_has_target_dim = has_obs and (
        "target" in ds["obs"].dims or "taxa" in ds["obs"].dims
    )
    obs_type = detect_obs_type(ds)

    log.info("Filtering valid targets…")
    indices = _valid_target_indices(ds)
    ds = ds.isel(target=indices)
    worms_ids = _read_worms_ids(ds)

    keys = [f"target_{i}" for i in indices]
    ds = ds.assign_coords(target=("target", keys))

    targets = [
        {
            "key": key,
            "label": raw_names[original_index],
            "target_id": worms_ids[position] if worms_ids is not None else None,
        }
        for position, (key, original_index) in enumerate(zip(keys, indices))
    ]
    log.info("Valid targets: %d", len(targets))

    return {
        "ds": ds,
        "targets": targets,
        "target_map": {t["key"]: t for t in targets},
        "lats": lats,
        "lons": lons,
        "metadata": metadata,
        "has_obs": has_obs,
        "obs_has_target_dim": obs_has_target_dim,
        "obs_type": obs_type,
        "sd_global_max": {},  # per target, filled lazily
        "sd_max_lock": Lock(),
        "obs_global_max": None,  # filled lazily on first need
        "obs_max_lock": Lock(),
    }


# --- lazily computed maxima ----------------------------------------------

def _warm_sd_max(file_url):
    """Background: compute the SD maximum of every target in one vectorised pass."""
    try:
        with _datasets_lock:
            entry = _datasets.get(file_url)
        if entry is None:
            return

        log.info("[warm] computing per-target SD max for %s…", file_url[-12:])
        sd_maxima = entry["ds"]["sd"].max(dim=["time", "lat", "lon"], skipna=True).values

        with entry["sd_max_lock"]:
            known = entry["sd_global_max"]
            for position, target in enumerate(entry["targets"]):
                if target["key"] in known:
                    continue  # already computed on demand
                known[target["key"]] = _positive_or_one(sd_maxima[position])
        log.info("[warm] done for %s", file_url[-12:])
    except Exception as e:
        log.warning("[warm] failed: %s", e)


def _positive_or_one(value):
    """Guard against a zero or non-finite maximum, which would break the scaling."""
    value = float(value)
    return value if (np.isfinite(value) and value > 0) else 1.0


def get_sd_max_for_target(entry, feature_key):
    """SD maximum for one target, computed on demand if not warmed yet."""
    with entry["sd_max_lock"]:
        value = entry["sd_global_max"].get(feature_key)
    if value is not None:
        return value

    value = _positive_or_one(
        entry["ds"]["sd"].sel(target=feature_key).max(skipna=True).values
    )
    with entry["sd_max_lock"]:
        entry["sd_global_max"][feature_key] = value
    return value


def get_obs_global_max(entry):
    """Observation maximum across the whole cube, for datasets without a target dim."""
    if entry["obs_global_max"] is not None:
        return entry["obs_global_max"]

    with entry["obs_max_lock"]:
        if entry["obs_global_max"] is None:
            value = float(entry["ds"]["obs"].max(skipna=True).values)
            entry["obs_global_max"] = value if np.isfinite(value) else None
    return entry["obs_global_max"]
