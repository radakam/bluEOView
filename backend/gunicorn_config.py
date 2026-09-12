# gunicorn_config.py
import os

# Bind to all interfaces. Changing API_PORT also means updating the port mapping
# in docker-compose.yml and the proxy_pass target in frontend/nginx.conf.
bind = f"0.0.0.0:{os.environ.get('API_PORT', 5000)}"

# One worker: each one loads its own copy of the opened NetCDF datasets, and the
# app is already threaded, so extra workers mostly cost memory.
workers = 1

timeout = 1200  # 20 min, since the first request for a dataset downloads it

# Logging
accesslog = "-" # Log to stdout for Docker logs
errorlog = "-"  # Log to stderr for Docker logs
