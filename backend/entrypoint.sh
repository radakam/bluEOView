#!/bin/sh

echo "Running pre-boot storage maintenance..."
flask --app app clean-storage

# Mirror the published .nc files into the data dir, fetching only newer ones:
# -r -np recurse without climbing up, -N skip unchanged, -nH -nd flatten paths.
wget -4 -r -N -np -nH -nd -A nc -nv -P /var/cephaloview_data/ https://data.up.ethz.ch/shared/Blueoview_data/

echo "Starting production WSGI server (Gunicorn)..."
exec gunicorn --config gunicorn_config.py app:app
