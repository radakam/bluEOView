"""Extraction of the quality-control table from a dataset.

The files carry two variables: `qc_col`, a colour per (algorithm, criterion),
and `qc_rec`, a recommendation per algorithm. Dimension names vary between
files, so they are matched by keyword rather than by position.
"""

import logging

from datasets import decode_str

log = logging.getLogger(__name__)

TARGET_DIM_KEYWORDS = ("target", "taxa")
ALGORITHM_DIM_KEYWORDS = ("alg", "model")
CRITERION_DIM_KEYWORDS = ("qc", "name", "crit")

NO_RECOMMENDATION = "No recommendation available."


def _match_dim(dims, keywords, default=None):
    return next((d for d in dims if any(k in d.lower() for k in keywords)), default)


def _select_target(da, feature_key):
    """Reduce the target dimension, if the variable has one."""
    target_dim = _match_dim(da.dims, TARGET_DIM_KEYWORDS)
    if target_dim is None:
        return da
    return da.sel({target_dim: feature_key}) if feature_key else da.isel({target_dim: 0})


def _labels(ds, dim, size, fallback):
    if dim in ds.coords:
        return [decode_str(v) for v in ds.coords[dim].values]
    return [f"{fallback} {i + 1}" for i in range(size)]


def _parse_recommendation(value):
    """Recommendations read "Use 'BRT' for …"; keep just the quoted algorithm."""
    text = decode_str(value)
    parts = text.split("'")
    if len(parts) >= 3:
        return parts[1] + "."
    return text if text.endswith(".") else text + "."


def extract_quality_control(ds, feature_key=None):
    """The QC table for one target, or None when the dataset carries no QC data."""
    if "qc_col" not in ds or "qc_rec" not in ds:
        return None

    qc_col = ds["qc_col"]
    qc_rec = ds["qc_rec"]
    log.info(
        "[qc] qc_col dims=%s, qc_rec dims=%s, feature=%s",
        list(qc_col.dims),
        list(qc_rec.dims),
        feature_key,
    )

    col_long_name = decode_str(qc_col.attrs.get("long_name", ""))
    rec_long_name = decode_str(qc_rec.attrs.get("long_name", ""))

    qc_col = _select_target(qc_col, feature_key)
    qc_rec = _select_target(qc_rec, feature_key)

    dims = list(qc_col.dims)
    if len(dims) != 2:
        raise ValueError(f"qc_col must be 2-D after reduction, got dims: {dims}")

    algorithm_dim = _match_dim(dims, ALGORITHM_DIM_KEYWORDS, default=dims[0])
    criterion_dim = _match_dim(
        dims,
        CRITERION_DIM_KEYWORDS,
        default=dims[1] if dims[1] != algorithm_dim else dims[0],
    )

    algorithms = _labels(ds, algorithm_dim, qc_col.sizes[algorithm_dim], "Algorithm")
    criteria = _labels(ds, criterion_dim, qc_col.sizes[criterion_dim], "Criterion")

    colors = [
        [decode_str(value) for value in row]
        for row in qc_col.transpose(algorithm_dim, criterion_dim).load().values
    ]

    rec_values = qc_rec.load().values
    if rec_values.ndim == 0:
        rec_values = rec_values.reshape(1)
    log.info("[qc] rec_values shape=%s, sample=%s", rec_values.shape, rec_values.ravel()[:3])

    recommendations = [_parse_recommendation(v) for v in rec_values.ravel()]
    # Pad or trim so every algorithm row has exactly one recommendation.
    recommendations += [NO_RECOMMENDATION] * (len(algorithms) - len(recommendations))
    recommendations = recommendations[: len(algorithms)]

    return {
        "available": True,
        "algorithms": algorithms,
        "qcNames": criteria,
        "colors": colors,
        "recommendations": recommendations,
        "qcColLongName": col_long_name,
        "qcRecLongName": rec_long_name,
    }
