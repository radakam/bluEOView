# Deploying without Docker

These notes cover running CEPHALOView directly on a server, behind nginx with
HTTPS. If you can run containers, `docker compose up --build` from the repository
root does all of this for you — see the [README](../README.md).

Commands below assume Debian or Ubuntu. On RHEL or Fedora, substitute `dnf` for
`apt` and `nginx` will already expect `/etc/nginx/conf.d/` rather than
`sites-available/`.

## Prerequisites

- Python 3.11 or newer
- Node 20 or newer
- nginx as the reverse proxy
- certbot for HTTPS certificates from Let's Encrypt
- `wget`, if you want the published datasets mirrored locally

## 1. Install system packages

```sh
sudo apt update && sudo apt upgrade
sudo apt install -y python3-pip python3-venv nginx git wget
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Clone the repository

```sh
cd /opt                            # or wherever you keep services
sudo git clone <repository-url> blueoview
cd blueoview
```

The rest of this guide writes that path as `/opt/blueoview`.

## 3. Install the backend

```sh
cd /opt/blueoview/backend
python3 -m venv blueoview_env
source blueoview_env/bin/activate
pip install -r requirements.txt gunicorn
```

Create the data directory the backend caches NetCDF files in, owned by the user the
service will run as:

```sh
sudo mkdir -p /var/cephaloview_data
sudo chown <username>:<group> /var/cephaloview_data
```

If that directory is not writable the backend falls back to `backend/.cache/` and
logs a warning rather than failing. Set `STORAGE_DIR` to use a different location.

Check it runs before going further:

```sh
python app.py                      # http://127.0.0.1:5000
```

## 4. Mirror the published datasets

Optional, but without it the dataset dropdown is empty and users can only load files
by URL. This is what the container does on boot:

```sh
wget -4 -r -N -np -nH -nd -A nc -nv \
  -P /var/cephaloview_data/ \
  https://data.up.ethz.ch/shared/Blueoview_data/
```

`-N` fetches only files that have changed, so it is safe to re-run from cron.

## 5. Run the backend under gunicorn

The repository ships `backend/gunicorn_config.py`: one worker, a 20-minute timeout
because the first request for a dataset downloads it, logging to the console.

Create `/etc/systemd/system/blueoview.service`:

```ini
[Unit]
Description=CEPHALOView backend
After=network.target

[Service]
User=<username>
Group=<group>
WorkingDirectory=/opt/blueoview/backend
Environment="PATH=/opt/blueoview/backend/blueoview_env/bin"
ExecStartPre=/opt/blueoview/backend/blueoview_env/bin/flask --app app clean-storage
ExecStart=/opt/blueoview/backend/blueoview_env/bin/gunicorn \
    --config gunicorn_config.py app:app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`ExecStartPre` deletes the files downloaded for user-supplied URLs, so a restart does
not inherit an unbounded cache of one-off downloads.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now blueoview
sudo systemctl status blueoview
```

Note that `gunicorn_config.py` binds `0.0.0.0`, so port 5000 is reachable from
outside unless the firewall blocks it. Keep it closed — see below — or change `bind`
to `127.0.0.1` in that file.

## 6. Build the frontend

```sh
cd /opt/blueoview/frontend
npm install
npm run build
```

This writes a static bundle to `frontend/build/`, which nginx serves directly. The
build assumes it is hosted at `/`; to serve it from a subpath, set `homepage` in
`package.json` first.

## 7. Configure nginx

`frontend/nginx.conf` is the configuration used in the container and is the best
starting point — it differs only in serving from `/usr/share/nginx/html` and
proxying to the `backend` container rather than to localhost.

Create `/etc/nginx/sites-available/blueoview`:

```nginx
server {
    listen 80;
    server_name <servername>;

    # Hashed build assets, safe to cache for a year.
    location /static/ {
        alias /opt/blueoview/frontend/build/static/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
    }

    # Long timeouts: the first request for a dataset downloads it.
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_read_timeout 1200s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Unknown paths fall back to the React app.
    location / {
        root /opt/blueoview/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it:

```sh
sudo ln -s /etc/nginx/sites-available/blueoview /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

If `sites-available/` and `sites-enabled/` do not exist, create them and add
`include /etc/nginx/sites-enabled/*;` to the `http` block of `/etc/nginx/nginx.conf`.

nginx needs to be able to read the build directory. Either set `user <username>;` at
the top of `nginx.conf` to match the service user, or make the path traversable by
`www-data`.

While you are in `nginx.conf`, these suit the large responses this app returns:

```nginx
keepalive_timeout 65;
client_max_body_size 100M;
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
proxy_max_temp_files_size 0;
```

## 8. Enable HTTPS

```sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <servername>
```

certbot edits the server block in place and sets up renewal.

## Firewall

### Shorewall

Edit `/etc/shorewall/rules`. To allow one address:

```
ACCEPT net:xxx.xxx.xxx.xxx fw tcp 80,443
```

Or to open the web server to everyone:

```
ACCEPT net fw tcp 80,443
```

Then reload:

```sh
sudo systemctl reload shorewall
```

Do not open port 5000. gunicorn binds all interfaces, and nginx is what should be
reaching it.
