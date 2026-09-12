"""CEPHALOView backend.

Serves the CEPHALOPOD NetCDF projections to the React frontend. Run in
production as `gunicorn --config gunicorn_config.py app:app`.
"""

import logging

from flask import Flask
from flask_cors import CORS

from api import api
from config import API_HOST, API_PORT
from storage import delete_sha1_nc_files

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = Flask(__name__)
CORS(app)
app.register_blueprint(api)


@app.cli.command("clean-storage")
def clean_storage_command():
    """Remove the NetCDF files downloaded for user-supplied URLs."""
    delete_sha1_nc_files()


if __name__ == "__main__":
    app.run(host=API_HOST, port=API_PORT, debug=False, threaded=True)
