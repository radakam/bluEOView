# Visualisation Tool for  [CEPHALOPOD](https://github.com/alexschickele/CEPHALOPOD)

This web application provides interactive visualizations of CEPHALOPOD using a Flask backend with a React-based frontend. The application includes a globe visualization, a flat map for the diversity and species distribution output of [CEPHALOPOD](https://github.com/alexschickele/CEPHALOPOD).

## Table of Contents

- [Features](#features)
- [Components](#components)
- [Project Structure](#project-structure)
- [Running with Docker](#running-with-docker)
- [Installation](#installation)
- [Firewall Configuration](#firewall-configuration)
- [License](#license)

## Features

- **Dataset selector**: Choose one of the NetCDF projections published on the BlueCloud infrastructure, or load any NetCDF file by URL.
- **Variable selector**: Searchable list of the targets in the dataset, with a link to the WoRMS record where the file carries an AphiaID.
- **Time frame**: Switch between the annual mean and a single month, with a slider over the twelve months.
- **Flat map visualisation**: 2D map of the projection, drawn with `react-plotly.js`, with zoom and pan.
- **Interactive globe display**: The same data on a 3D globe, drawn with `react-globe.gl`.
- **Standard deviation and observations**: Optional side-by-side panels; cells whose standard deviation exceeds half the global maximum are hatched on the map and dimmed on the globe.
- **Quality control**: Per-algorithm traffic-light table with the recommendation stored in the file.
- **References**: Method paper plus the global attributes of the loaded dataset.

## Components

### `DataPanel`
Owns the current view — variable, month, map or globe, and the shared zoom — and pairs the control panels with the figures they drive.

### `ControlPanel`
Source, variable and time-frame pickers, the map/globe switch, and the toggles for the standard-deviation and observation panels.

### `QualityPanel`
Quality-control table for the selected variable, or a note when the file has been pre-filtered and carries no QC data.

### `MapDisplay`
2D map panels drawn with `react-plotly.js`. Values use a banded viridis scale; uncertain cells are hatched on a canvas overlay, since Plotly cannot pattern-fill a heatmap.

### `GlobeDisplay`
The same panels on a 3D globe drawn with `react-globe.gl`, sampling every third grid cell and with a hand-drawn colour legend.

### `InfoModal` / `ReferencesModal` / `WormsModal`
Explanatory text, dataset references, and the taxonomic classification fetched from the WoRMS registry.
`WormsModal` also shows a photograph of the taxon, from the WoRMS photogallery or, where it holds none,
from Wikimedia Commons.

## Project Structure

```
backend/
  app.py        Flask app: configuration, blueprints, CLI commands
  api.py        HTTP handlers for /api/*
  datasets.py   NetCDF loading, caching and derived values
  quality.py    Quality-control table extraction
  worms.py      Taxon names and photographs from the WoRMS registry
  wikimedia.py  Photograph search on Wikimedia Commons, for taxa WoRMS has no picture of
  storage.py    Download cache on disk
  config.py     Environment-derived settings

frontend/src/
  api/          Calls to the backend and to the WoRMS registry
  hooks/        Data fetching and DOM measurement hooks
  components/   Components; common/ holds the shared building blocks
  styles/       Style objects shared between components
  constants.js  Colour scales, thresholds and other fixed data
  content.js    User-facing copy
  utils.js      Pure helpers for scales, legends and labels
```

## Running with Docker

`docker-compose.yml` builds both services and is the quickest way to run the whole
application:

```sh
docker compose up --build
```

The frontend is then served by nginx on <http://localhost:8080>, which proxies
`/api` to the Flask backend on port 5000. NetCDF files are cached in
`backend/data/`, mounted into the backend container at `/var/cephaloview_data`.
On boot the backend removes the files downloaded for user-supplied URLs and
refreshes the published datasets with `wget`.

Optional environment variables for the backend service:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATA_URL` | `https://data.up.ethz.ch/shared/Blueoview_data` | Remote directory the published datasets come from. |
| `STORAGE_DIR` | `/var/cephaloview_data` | Local cache directory. |

## Installation

The steps below set the application up directly on a server, without Docker.

### Prerequisites

- A Linux-based server (e.g., Ubuntu) with `Python 3.9+`
- `Nginx` as the reverse proxy server
- `Gunicorn` as the WSGI server for running Flask
- `Certbot` for managing HTTPS certificates via Let's Encrypt
- Shorewall for firewall management

### Step-by-Step Installation

1. **SSH into the Server:**\
   `ssh username@servername`
2. **Update the System:**\
   `sudo dnf update`\
   `sudo dnf upgrade`
3. **Install Dependencies** Install Python 3, pip, and venv:\
   `sudo dnf install python3-pip python3-virtualenv nginx git`
4. **Clone this Application**
   Navigate to a chosen directory <directory>:\
   
   `git clone <your-repository-url>`
6. **Create a Python Virtual Environment and Install Dependencies**\
   `cd mapmaker_js/backend`\
   `python3 -m venv mapmaker_env`\
   `source mapmaker_env/bin/activate`\
   `pip install -r requirements.txt`

   `cd mapmaker_js/frontend`\
   `curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -`\
   `sudo dnf install -y nodejs`\
   `npm install`

7. **Test locally:**\
   run `python app.py` on the backend directory
   and `npm start` on the frontend directory

8. **Set Up Gunicorn:** Create a Gunicorn service file:\
   `pip install gunicorn`\
   `sudo vim /etc/systemd/system/mapmaker_backend.service`\
   Add the following:\
   ```
   [Unit]
   Description=Gunicorn instance to serve mapmaker-new
   After=network.target

   [Service]
   User=<username>
   Group=<group><group>
   WorkingDirectory=<directory>/mapmaker_js/backend
   Environment="PATH=<directory>/mapmaker_js/backend/mapmaker_env/bin"
   ExecStart=<directory>/mapmaker_js/backend/mapmaker_env/bin/gunicorn --workers 3 --bind unix:<directory>/mapmaker/mapmaker.sock  -m 007 --timeout 120 app:app

   [Install]
   WantedBy=multi-user.target
   ```

   Set ownership of the socket and directory:

   `sudo chown <username>:<group> <directory>/mapmaker_js/backend/mapmaker_backend.sock`\
   `sudo chmod 770 <directory>/mapmaker_js/backend/mapmaker_backend.sock`\
   `sudo chown <username>:<group> <directory>/mapmaker_js/backend`\
   `sudo chmod 755 <directory>/mapmaker_js/backend`

9. **Start and Enable Gunicorn:**\
   `sudo systemctl start mapmaker_backend`\
   `sudo systemctl enable mapmaker_backend`

10. **Build the React Application:**

   Before deploying, you need to build the frontend (React) application. From the frontend directory, run the following commands:

   `cd mapmaker_js/frontend`\
   `npm install`\
   `npm run build`

   `sudo mkdir -p <directory>/`\
   `mapmaker_js/frontend_build`\
   `sudo cp -r build/* <directory>/mapmaker_js/frontend_build/`

   Make sure the user and group match with those in mapmaker_backend.service

11. **Install and Configure Nginx:**\
    `sudo dnf install nginx`\
    `sudo vim /etc/nginx/sites-available/mapmaker``\
    Add the following:

   ```
      server {
      listen 80;
      server_name <servername>;

      location /mapmaker/static/ {
         alias <directory>/mapmaker_js/frontend_build/static/;
         expires 1y;
         access_log off;
         add_header Cache_Control "public";
      }

      #Serve the React app for all other routes (single-page application behaviour)
      location / {
         root <directory>/mapmaker_js/frontend_build;
         try_files $uri /index.html
      }

      # Proxy API requests to the backend (Flask)
      location /api {
         include proxy_params;
         proxy_pass http://unix:<directory>/mapmaker_js/backend/mapmaker_backend.sock;
         }
      }
   ```

11. **Enable the site:**\
   `sudo ln -s /etc/nginx/sites-available/mapmaker /etc/nginx/sites-enabled/`\
   `sudo nginx -t`\
   `sudo systemctl restart nginx`

   In case sites-available/ and sites-enabled/ do not exist, you can create them

   `sudo mkdir -p /etc/nginx/sites-available`

   Make sure proxy_params exists or create it
   'sudo vim /etc/nginx/proxy_params`\

   Write the following configuration:
   ```
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

12. **Update nginx.conf (if necessary):**

At the top set the user as in the mapmaker_backend.service\
`user <username>;`

In the http block you can add the following:
`include /etc/nginx/sites-enabled/*;

Near the end of the http block you can also add:\
`keep_alive_timeout 65;`\
`client_max_body_size 100M;`\
`proxy_buffer_size 128k;`\
`proxy_buffers 4 256k;`\
`proxy_busy_buffers_size 256k;`\
`proxy_max_temp_files_size 0;`

13. **Set Up HTTPS with Certbot:** Install Certbot and the Nginx plugin:\
`sudo apt install certbot python3-certbot-nginx`\
`sudo certbot --nginx -d mapmaker-new`

## Firewall Configuration

### Using Shorewall

To configure the firewall using Shorewall, follow these steps to manage access to the web server.

#### Edit Shorewall Rules
You need to edit the `/etc/shorewall/rules` file to modify access settings:

`sudo nano /etc/shorewall/rules`

#### Allow Access from a Specific IP
To allow access from a specific IP address (replace xxx.xxx.xxx.xxx with the actual IP), add the following rule:\
`ACCEPT net:xxx.xxx.xxx.xxx fw tcp 80,443`

#### Reload the Firewall

`sudo systemctl reload shorewall`

#### Full Webserver Access

`ACCEPT net fw tcp 80,443`\
`sudo systemctl reload shorewall`

## License

Released under the MIT License. See [LICENSE](LICENSE).
