"""On-disk cache of NetCDF files.

Two kinds of file live in CACHE_DIR: the ones prefetched from DATA_URL by the
entrypoint, which keep their original names, and the ones downloaded on demand
for user-supplied URLs, which are named after the SHA-1 of the URL so they can
be told apart and cleaned up separately.
"""

import hashlib
import logging
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import requests

from config import CACHE_DIR, DATA_URL, DOWNLOAD_CHUNK_BYTES, DOWNLOAD_TIMEOUT_SECONDS

log = logging.getLogger(__name__)

# Files downloaded for a user-supplied URL: 40 hex characters plus the extension.
SHA1_FILENAME = re.compile(r"^[0-9a-fA-F]{40}\.nc$")

# Maps a remote URL to the local file holding its contents.
_downloaded_files = {}


def dataset_label(filename):
    """Turn 'L3_plankton_species_diversity_from_occurrence_20260518.nc' into
    'Diversity from occurrence'."""
    name = re.sub(r"\.nc$", "", filename)
    name = re.sub(r"_\d{8}$", "", name)  # trailing date stamp
    name = re.sub(r"^L\d+_plankton_species_", "", name)  # generic prefix
    return name.capitalize().replace("_", " ")


def list_datasets():
    """The cached NetCDF files, as `{label, value}` pairs the frontend can offer."""
    return [
        {"label": dataset_label(filename), "value": f"{DATA_URL.rstrip('/')}/{filename}"}
        for filename in sorted(os.listdir(CACHE_DIR))
        if filename.endswith(".nc")
    ]


def get_local_path(file_url):
    """Path to a local copy of `file_url`, downloading it if necessary."""
    cached = _downloaded_files.get(file_url)
    if cached and os.path.exists(cached):
        return cached

    # A prefetched file keeps its own name; look for that first.
    filename = os.path.basename(urlparse(file_url).path)
    for candidate in (
        os.path.join(CACHE_DIR, filename),
        os.path.join(CACHE_DIR, f"{_url_digest(file_url)}.nc"),
    ):
        if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
            _downloaded_files[file_url] = candidate
            log.info("Disk cache hit: %s", candidate)
            return candidate

    return _download(file_url, os.path.join(CACHE_DIR, f"{_url_digest(file_url)}.nc"))


def _url_digest(file_url):
    return hashlib.sha1(file_url.encode("utf-8")).hexdigest()


def _download(file_url, target_path):
    """Stream `file_url` to a temporary file, then move it into place atomically."""
    log.info("Downloading: %s", file_url)
    response = requests.get(file_url, stream=True, timeout=DOWNLOAD_TIMEOUT_SECONDS)
    response.raise_for_status()

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".nc.part", dir=CACHE_DIR)
    try:
        for chunk in response.iter_content(chunk_size=DOWNLOAD_CHUNK_BYTES):
            tmp.write(chunk)
        tmp.close()
        os.replace(tmp.name, target_path)
    except Exception:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass
        raise

    _downloaded_files[file_url] = target_path
    log.info("Downloaded to: %s", target_path)
    return target_path


def delete_sha1_nc_files(target_directory=CACHE_DIR):
    """Remove the files downloaded for user-supplied URLs. Run before boot, so a
    restart does not inherit an unbounded cache of one-off downloads."""
    deleted = 0
    for file_path in Path(target_directory).iterdir():
        if not file_path.is_file() or not SHA1_FILENAME.match(file_path.name):
            continue
        try:
            file_path.unlink()
            log.info("Deleted: %s", file_path.name)
            deleted += 1
        except OSError as e:
            log.warning("Error deleting %s: %s", file_path.name, e)

    log.info("Removed %d user-downloaded file(s).", deleted)
    return deleted

