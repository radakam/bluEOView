"""HTTP surface of the backend: thin handlers over `datasets` and `quality`."""

import logging
import traceback

import numpy as np
from flask import Blueprint, jsonify, request

from datasets import (
    drop_time,
    get_dataset,
    get_obs_global_max,
    get_sd_max_for_target,
    slice_to_2d,
    variable_info,
)
from quality import extract_quality_control
from storage import list_datasets
import wikimedia
import worms

log = logging.getLogger(__name__)

api = Blueprint("api", __name__, url_prefix="/api")

# Upper percentile used as the top of the mean colour scale, so a handful of
# extreme cells cannot flatten the rest of the map.
MEAN_SCALE_PERCENTILE = 95


class ApiError(Exception):
    """Error to report to the client, with the status code to send."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


@api.errorhandler(ApiError)
def handle_api_error(error):
    return jsonify({"error": error.message}), error.status


def required_arg(name):
    value = request.args.get(name, type=str)
    if not value:
        raise ApiError(f"Missing required parameter: {name}")
    return value


def load_dataset(file_url):
    try:
        return get_dataset(file_url)
    except Exception as e:
        traceback.print_exc()
        raise ApiError(f"Failed to load dataset: {e}", status=500) from e


def resolve_target(dataset, feature_key):
    if feature_key not in dataset["target_map"]:
        raise ApiError(f"Unknown feature '{feature_key}'")
    return dataset["target_map"][feature_key]


@api.route("/datasets", methods=["GET"])
def datasets_route():
    try:
        return jsonify(list_datasets())
    except OSError as e:
        raise ApiError(f"Cannot read the data directory: {e}", status=500) from e


@api.route("/diversity-map", methods=["GET"])
def diversity_map():
    file_url = required_arg("file")
    feature_key = required_arg("feature")
    month_index = request.args.get("timeIndex", default=1, type=int)

    dataset = load_dataset(file_url)
    ds = dataset["ds"]
    target = resolve_target(dataset, feature_key)

    max_time = ds.sizes["time"]
    if not 1 <= month_index <= max_time:
        raise ApiError(f"timeIndex {month_index} out of range 1–{max_time}")
    time_index = month_index - 1

    mean_slice = ds["mean"].sel(target=feature_key).isel(time=time_index).load()
    finite_mean = mean_slice.values[np.isfinite(mean_slice.values)]
    min_value = round(float(finite_mean.min()), 3) if finite_mean.size else None
    max_value = (
        round(float(np.percentile(finite_mean, MEAN_SCALE_PERCENTILE)), 3)
        if finite_mean.size
        else None
    )

    sd_slice = ds["sd"].sel(target=feature_key).isel(time=time_index).load()
    sd_max = get_sd_max_for_target(dataset, feature_key)

    obs_2d, obs_max = _observation_slice(dataset, feature_key, time_index)

    return jsonify(
        {
            "feature": feature_key,
            "label": target["label"],
            "lats": dataset["lats"],
            "lons": dataset["lons"],
            "mean": slice_to_2d(mean_slice),
            "sd": slice_to_2d(sd_slice),
            "minValue": min_value,
            "maxValue": max_value,
            "sdGlobalMax": sd_max,
            "sdMax": sd_max,  # legacy alias
            "obs": obs_2d,
            "obsMax": obs_max,
            "obsType": dataset["obs_type"],
            "hasObs": obs_2d is not None,
        }
    )


def _observation_slice(dataset, feature_key, time_index):
    """Observations for one target at one time step, as (grid, maximum).

    Observations are optional and their layout varies, so a failure here degrades
    to "no observations" rather than failing the whole request.
    """
    if not dataset["has_obs"]:
        return None, None

    obs_var = dataset["ds"]["obs"]
    try:
        if dataset["obs_has_target_dim"]:
            obs_slice = drop_time(obs_var.sel(target=feature_key), time_index).load()
            values = obs_slice.values.astype(np.float64)
            finite = values[np.isfinite(values)]
            return slice_to_2d(obs_slice), (
                round(float(finite.max()), 3) if finite.size else None
            )

        obs_slice = drop_time(obs_var, time_index).load()
        return slice_to_2d(obs_slice), get_obs_global_max(dataset)
    except Exception as e:
        log.warning("obs extraction failed for %s: %s", feature_key, e)
        return None, None


@api.route("/diversity-features", methods=["GET"])
def diversity_features():
    dataset = load_dataset(required_arg("file"))
    ds = dataset["ds"]

    name_var = next((v for v in ("target_name", "taxa_name") if v in ds), None)
    name_info = variable_info(ds, name_var) if name_var else {}
    time_info = variable_info(ds, "time") if "time" in ds else {}

    return jsonify(
        {
            "features": [
                {
                    "value": target["key"],
                    "label": target["label"].replace("_", " ").title(),
                    "description": f"Diversity metric: {target['label']}",
                    "target_id": target["target_id"],
                    "standard_name": name_info.get("standard_name"),
                    "long_name": name_info.get("long_name"),
                }
                for target in dataset["targets"]
            ],
            "timeLongName": time_info.get("long_name"),
            "metadata": dataset["metadata"],
            "hasObs": dataset["has_obs"],
            "obsType": dataset["obs_type"],
            "varInfo": {name: variable_info(ds, name) for name in ("mean", "sd", "obs")},
        }
    )


@api.route("/diversity-qc", methods=["GET"])
def diversity_qc():
    file_url = required_arg("file")
    feature_key = request.args.get("feature", type=str)

    dataset = load_dataset(file_url)
    if feature_key:
        resolve_target(dataset, feature_key)

    try:
        table = extract_quality_control(dataset["ds"], feature_key)
    except Exception as e:
        log.warning("QC extraction error: %s", e)
        raise ApiError(f"Failed to extract QC data: {e}", status=500) from e

    return jsonify(table or {"available": False})


@api.route("/species-image", methods=["GET"])
def species_image_route():
    """A photograph of one taxon, from WoRMS or else from Wikimedia Commons.

    WoRMS comes first, since a picture in the registry belongs to the record the
    frontend is showing, but its gallery is sparse.

    The picture only illustrates data the frontend already has, so a missing one
    and an unreachable archive alike answer "no image" rather than fail.
    """
    aphia_id = request.args.get("aphiaId", type=int)
    if not aphia_id or aphia_id <= 0:
        raise ApiError("Missing or invalid parameter: aphiaId")

    image = _worms_image(aphia_id) or _wikimedia_image(aphia_id)
    return jsonify(image or {"available": False})


def _worms_image(aphia_id):
    try:
        return worms.species_image(aphia_id)
    except Exception as e:
        log.warning("WoRMS image lookup failed for AphiaID %s: %s", aphia_id, e)
        return None


def _wikimedia_image(aphia_id):
    """The taxon on Commons, found by the names WoRMS files it under."""
    try:
        return wikimedia.species_image(*worms.scientific_names(aphia_id))
    except Exception as e:
        log.warning("Commons image lookup failed for AphiaID %s: %s", aphia_id, e)
        return None
