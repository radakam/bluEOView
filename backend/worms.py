"""Species photographs from the World Register of Marine Species.

WoRMS' REST API covers taxonomy but exposes no images, so the photogallery is
read out of the taxon page's HTML instead. Only pictures WoRMS hosts itself are
offered: their author and licence live on a sibling page, while contributed
thumbnails point at third-party sites that are often plain HTTP or block
hotlinking.

Lookups are cached in memory: a gallery changes rarely, and every miss costs two
requests to marinespecies.org.
"""

import html
import logging
import re
from functools import lru_cache

import requests

from config import WORMS_TIMEOUT_SECONDS

log = logging.getLogger(__name__)

BASE_URL = "https://www.marinespecies.org"

# The image server resizes on request, but never past the original.
DISPLAY_WIDTH = 600

# Pictures to try per taxon, in case a detail page is missing or unparseable.
MAX_ATTEMPTS = 3

CACHE_SIZE = 512

# Start of the gallery; earlier parts of the record hold markup that matches too.
_GALLERY_ANCHOR = 'id="image-gallery-data"'

# Reviewed and unreviewed pictures sit in separate lists. Type "image" is
# WoRMS-hosted; "link" is a thumbnail borrowed from another database.
_IMAGE_LIST = re.compile(r'<div id="(checked|unchecked)-image-list"')
_HOSTED_ITEM = re.compile(
    r'<div class="gallery-item" data-image-id="(\d+)" data-image-type="image"'
)

_MAIN_IMAGE = re.compile(r'<div id="photogallery_resized_img">\s*<img[^>]*src="([^"]+)"')
_LICENSE = re.compile(r'<meta itemprop="license" content="([^"]+)"')
_WIDTH_PARAM = re.compile(r"([?&]w=)\d+")
_CREATIVE_COMMONS = re.compile(r"creativecommons\.org/licenses/([a-z-]+)/([\d.]+)")
_TAG = re.compile(r"<[^>]+>")


def _caption(field):
    """Matcher for one labelled line of the picture's caption block."""
    return re.compile(
        rf'<span class="photogallery_caption photogallery_{field}">.*?'
        rf'<span class="photogallery_caption photogallery_text">(.*?)</span>',
        re.S,
    )


_TITLE = re.compile(r'<div class="photogallery_caption photogallery_title">(.*?)</div>', re.S)
_AUTHOR = _caption("author")
_DESCRIPTION = _caption("descr")


def picture_page_url(picture_id):
    """Public page of one picture, where WoRMS states its author and licence."""
    return f"{BASE_URL}/aphia.php?p=image&pic={picture_id}"


def species_image(aphia_id):
    """A photograph of one taxon, or None when WoRMS hosts none for it.

    Failures propagate; the caller decides how loudly to report a missing picture.
    """
    for picture_id in _hosted_picture_ids(aphia_id)[:MAX_ATTEMPTS]:
        details = _picture_details(picture_id)
        if details:
            return details
    return None


@lru_cache(maxsize=CACHE_SIZE)
def _hosted_picture_ids(aphia_id):
    """WoRMS-hosted picture ids on a taxon page, reviewed ones first.

    Returned as a tuple so `lru_cache` hands out an immutable result.
    """
    page = _get(f"{BASE_URL}/aphia.php?p=taxdetails&id={aphia_id}")

    anchor = page.find(_GALLERY_ANCHOR)
    if anchor < 0:
        return ()
    gallery = page[anchor:]

    lists = [(m.start(), m.group(1)) for m in _IMAGE_LIST.finditer(gallery)]
    by_status = {"checked": [], "unchecked": []}
    for item in _HOSTED_ITEM.finditer(gallery):
        # An item belongs to the list that most recently opened before it.
        status = next((s for start, s in reversed(lists) if start < item.start()), "unchecked")
        by_status[status].append(item.group(1))

    return tuple(by_status["checked"] + by_status["unchecked"])


@lru_cache(maxsize=CACHE_SIZE)
def _picture_details(picture_id):
    """Source, caption and licence of one picture, or None if the page has no image."""
    page = _get(picture_page_url(picture_id))

    source = _MAIN_IMAGE.search(page)
    if not source:
        log.warning("No image found on WoRMS picture page %s", picture_id)
        return None

    license_url = _first(_LICENSE, page)
    return {
        "available": True,
        "url": _sized(html.unescape(source.group(1))),
        "title": _text(_TITLE, page),
        "author": _text(_AUTHOR, page),
        "description": _text(_DESCRIPTION, page),
        "licenseUrl": license_url,
        "licenseName": _license_name(license_url),
        "pageUrl": picture_page_url(picture_id),
    }


def _get(url):
    response = requests.get(
        url,
        # Name the caller rather than send the library default.
        headers={"User-Agent": "CEPHALOView (https://github.com/radakam/bluEOView)"},
        timeout=WORMS_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.text


def _first(pattern, page):
    match = pattern.search(page)
    return match.group(1) if match else None


def _text(pattern, page):
    """One caption field as plain text, with its markup and entities resolved."""
    raw = _first(pattern, page)
    if raw is None:
        return None
    collapsed = " ".join(html.unescape(_TAG.sub("", raw)).split())
    return collapsed or None


def _sized(source_url):
    """The image at the width the frontend displays it at."""
    scaled, replacements = _WIDTH_PARAM.subn(rf"\g<1>{DISPLAY_WIDTH}", source_url)
    if replacements:
        return scaled
    separator = "&" if "?" in source_url else "?"
    return f"{source_url}{separator}w={DISPLAY_WIDTH}"


def _license_name(license_url):
    """'CC BY-NC-SA 4.0' for a Creative Commons deed, None for anything else."""
    match = _CREATIVE_COMMONS.search(license_url or "")
    return f"CC {match.group(1).upper()} {match.group(2)}" if match else None
