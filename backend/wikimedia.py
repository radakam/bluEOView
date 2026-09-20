"""Species photographs from Wikimedia Commons.

Stands in where the WoRMS photogallery is empty, as it is even for Emiliania
huxleyi. Commons is searched by scientific name through the MediaWiki API,
which returns the file, its author and its licence in one request.

Lookups are cached in memory: the pictures of a taxon change rarely.
"""

import html
import re
from functools import lru_cache

import requests

from config import WIKIMEDIA_TIMEOUT_SECONDS

API_URL = "https://commons.wikimedia.org/w/api.php"

# The API resizes on request, but never past the original.
DISPLAY_WIDTH = 600

# Candidates to weigh per name: enough for a well-named file to surface.
MAX_CANDIDATES = 10

CACHE_SIZE = 512

# Photographs and micrographs only: no diagrams, maps, video or sound.
_MEDIA_FILTER = "filetype:bitmap"

_TAG = re.compile(r"<[^>]+>")
_EXTENSION = re.compile(r"\.[A-Za-z0-9]+$")


def species_image(name, fallback_name=None):
    """A Commons photograph of one taxon, or None when the search finds nothing.

    A renamed taxon is looked for under `fallback_name` too, since Commons may
    still file it under either name.

    Failures propagate; the caller decides how loudly to report a missing picture.
    """
    for candidate_name in (name, fallback_name):
        if not candidate_name:
            continue
        image = _search(candidate_name)
        if image:
            return image
    return None


@lru_cache(maxsize=CACHE_SIZE)
def _search(name):
    """Best picture Commons offers for one scientific name, or None."""
    pages = _query(name)
    if not pages:
        return None

    # A file that only mentions the taxon is still shown when none is named
    # after it; its caption says what it is.
    best = min(pages, key=lambda page: (-_name_score(page, name), page.get("index", 0)))
    return _details(best)


def _query(name):
    """File pages whose text carries the name, as the search ranked them."""
    response = requests.get(
        API_URL,
        params={
            "action": "query",
            "format": "json",
            "generator": "search",
            # Quoted, so that the name matches as a phrase and not as two
            # words that happen to share a page.
            "gsrsearch": f'"{name}" {_MEDIA_FILTER}',
            "gsrnamespace": 6,  # File:
            "gsrlimit": MAX_CANDIDATES,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": DISPLAY_WIDTH,
            "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|ImageDescription|ObjectName",
        },
        # Commons asks callers to name themselves rather than send a default.
        headers={"User-Agent": "CEPHALOView (https://github.com/radakam/bluEOView)"},
        timeout=WIKIMEDIA_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    pages = response.json().get("query", {}).get("pages", {})
    return [page for page in pages.values() if page.get("imageinfo")]


def _name_score(page, name):
    """How plainly a file claims to show the taxon, by what it is called.

    A file named after the taxon is almost certainly of it; one that merely
    mentions it may show something else, such as the virus infecting it. The
    epithet alone still counts, for pictures filed under a synonym of the genus.
    """
    words = name.lower().split()
    title = f"{_file_name(page)} {_metadata(page, 'ObjectName') or ''}".lower()

    if all(word in title for word in words):
        return 2
    return 1 if words[-1] in title else 0


def _details(page):
    """Source, caption and licence of one Commons file."""
    info = page["imageinfo"][0]
    return {
        "available": True,
        "source": "wikimedia",
        "sourceName": "Wikimedia Commons",
        "url": info.get("thumburl") or info["url"],
        "title": _metadata(page, "ObjectName") or _file_name(page),
        "author": _metadata(page, "Artist"),
        "description": _metadata(page, "ImageDescription"),
        "licenseUrl": _metadata(page, "LicenseUrl"),
        "licenseName": _metadata(page, "LicenseShortName"),
        "pageUrl": info.get("descriptionurl"),
    }


def _file_name(page):
    """The file's name, without the namespace it lives in or its extension."""
    title = page.get("title", "")
    return _EXTENSION.sub("", title.split(":", 1)[-1])


def _metadata(page, field):
    """One extmetadata field as plain text; Commons stores them as HTML."""
    entry = page["imageinfo"][0].get("extmetadata", {}).get(field)
    if not entry:
        return None
    collapsed = " ".join(html.unescape(_TAG.sub("", str(entry.get("value", "")))).split())
    return collapsed or None
