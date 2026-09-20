# CEPHALOView

Interactive visualisation of the marine plankton projections produced by
[CEPHALOPOD](https://github.com/alexschickele/CEPHALOPOD). A Flask backend reads the
NetCDF output; a React frontend draws it as a flat map or a 3D globe.

Built for the BlueCloud 2026 project.

## Features

- **Datasets** — pick one of the NetCDF projections published on the BlueCloud
  infrastructure, or paste the URL of any NetCDF file.
- **Variables** — searchable list of the targets in the file, linking to the WoRMS
  record wherever the file carries an AphiaID.
- **Time** — annual mean, or a single month chosen on a slider.
- **Map and globe** — the same data either as a 2D map (`react-plotly.js`) or on a
  rotatable globe (`react-globe.gl`), with zoom and pan shared between them.
- **Uncertainty and observations** — optional side-by-side panels. Cells whose
  standard deviation exceeds half the global maximum are hatched on the map and
  dimmed on the globe.
- **Quality control** — per-algorithm traffic-light table, with the recommendation
  stored in the file.
- **References** — the method paper, plus the global attributes of the loaded file.

## Running with Docker

The quickest way to run everything:

```sh
docker compose up --build
```

The frontend is then served by nginx on <http://localhost:8080>, proxying `/api` to
the Flask backend on port 5000. NetCDF files live in `backend/data/`, mounted into
the backend container at `/var/cephaloview_data`. On boot the backend deletes the
files downloaded for user-supplied URLs, then mirrors the published datasets with
`wget`, fetching only ones that have changed.

The first request for a dataset downloads it, which is why the gunicorn and nginx
timeouts are set to 20 minutes.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATA_URL` | `https://data.up.ethz.ch/shared/Blueoview_data` | Directory the published datasets are offered from. |
| `STORAGE_DIR` | `/var/cephaloview_data` | Local cache directory. |
| `API_PORT` | `5000` | Port gunicorn binds. |

Note that `DATA_URL` only controls the URLs offered to the frontend; the boot-time
`wget` mirror in `backend/entrypoint.sh` has its URL hardcoded, so pointing at a
different server means editing both.

## Running locally

Backend — needs Python 3.11 or newer:

```sh
cd backend
python3 -m venv blueoview_env
source blueoview_env/bin/activate
pip install -r requirements.txt
python app.py                      # http://127.0.0.1:5000
```

Frontend — needs Node 20 or newer:

```sh
cd frontend
npm install
npm start                          # http://localhost:3000
npm test                           # unit tests
```

`npm start` proxies `/api` to `127.0.0.1:5000`, set by the `proxy` field in
`package.json`.

Outside Docker the backend caches into `STORAGE_DIR`, which defaults to
`/var/cephaloview_data` and falls back to `backend/.cache/` with a warning when that
is not writable. Nothing mirrors the published datasets, so that directory starts
empty and the dataset dropdown is empty with it — paste a NetCDF URL to load one, or
run the `wget` command from [docs/deployment.md](docs/deployment.md) by hand.

## Project structure

```
backend/
  app.py        Flask app, plus the clean-storage CLI command
  api.py        HTTP handlers for /api/*
  datasets.py   NetCDF loading, in-memory caching and derived values
  quality.py    Quality-control table extraction
  worms.py      Taxon names and photographs from the WoRMS registry
  wikimedia.py  Commons photograph search, for taxa WoRMS has no picture of
  storage.py    Download cache on disk
  config.py     Environment-derived settings

frontend/src/
  api/          Calls to the backend and to WoRMS
  hooks/        Data fetching and DOM measurement
  components/   UI; common/ holds the shared building blocks
  styles/       Style objects shared between components
  constants.js  Colour scales, thresholds and other fixed data
  content.js    User-facing copy
  utils.js      Pure helpers for scales, legends and labels
```

The components worth knowing about:

- **`DataPanel`** owns the current view — variable, month, map or globe, shared zoom —
  and pairs each control panel with the figure it drives.
- **`ControlPanel`** holds the source, variable and time pickers, the map/globe switch
  and the layer toggles.
- **`MapDisplay`** draws the 2D panels. Values use a banded viridis scale, and
  uncertain cells are hatched on a canvas overlay, since Plotly cannot pattern-fill a
  heatmap.
- **`GlobeDisplay`** draws the same panels on a globe, sampling every third grid cell
  and with a hand-drawn colour legend.
- **`QualityPanel`** shows the QC table, or a note when the file was pre-filtered and
  carries none.
- **`InfoModal`**, **`ReferencesModal`** and **`WormsModal`** hold the explanatory text,
  the dataset references, and the taxonomic record fetched from WoRMS — the last with
  a photograph from the WoRMS gallery, or Wikimedia Commons where it has none.

## API

All endpoints are `GET` under `/api`. `file` is the URL of a NetCDF file.

| Endpoint | Parameters | Returns |
| --- | --- | --- |
| `/datasets` | — | The published files available locally, as label/URL pairs. |
| `/diversity-features` | `file` | Targets in the file, its global attributes, and variable descriptions. |
| `/diversity-map` | `file`, `feature`, `timeIndex` | Mean, standard-deviation and observation grids for one target. |
| `/diversity-qc` | `file`, `feature` | The quality-control table, or `{"available": false}`. |
| `/species-image` | `aphiaId` | A photograph of the taxon, or `{"available": false}`. |

## Deployment

For running on a server without Docker — gunicorn, nginx, HTTPS and firewall — see
[docs/deployment.md](docs/deployment.md).

## License

Released under the MIT License. See [LICENSE](LICENSE).
