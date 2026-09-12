"""Environment-derived settings for the CEPHALOView backend."""

import logging
import os
from pathlib import Path

log = logging.getLogger(__name__)

# Remote directory the published NetCDF files are served from.
DATA_URL = os.environ.get("DATA_URL", "https://data.up.ethz.ch/shared/Blueoview_data")

# Address the development server binds to. In the container gunicorn binds the
# same port; see gunicorn_config.py.
API_HOST = os.environ.get("API_HOST", "127.0.0.1")
API_PORT = int(os.environ.get("API_PORT", 5000))

DOWNLOAD_TIMEOUT_SECONDS = 120
DOWNLOAD_CHUNK_BYTES = 1 << 20  # 1 MB

DEFAULT_CACHE_DIR = "/var/cephaloview_data"
LOCAL_CACHE_DIR = Path(__file__).resolve().parent / ".cache"


def _resolve_cache_dir():
    """The directory holding the NetCDF files, falling back when unusable.

    In the container STORAGE_DIR is a mounted volume. Outside it, the default
    usually belongs to root, so rather than failing on the first request the
    backend keeps its cache next to the code and says so.
    """
    configured = os.environ.get("STORAGE_DIR", DEFAULT_CACHE_DIR)
    try:
        os.makedirs(configured, exist_ok=True)
        if os.access(configured, os.W_OK):
            return configured
        problem = "not writable"
    except OSError as e:
        problem = e

    fallback = str(LOCAL_CACHE_DIR)
    os.makedirs(fallback, exist_ok=True)
    log.warning(
        "Cache directory %s is unusable (%s); using %s instead. "
        "Set STORAGE_DIR to choose a different one.",
        configured,
        problem,
        fallback,
    )
    return fallback


CACHE_DIR = _resolve_cache_dir()
