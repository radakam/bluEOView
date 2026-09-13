FROM python:3.11-slim AS base

WORKDIR /app

ENV PYTHONUNBUFFERED 1
ENV FLASK_ENV production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1
# Install into the system Python rather than a virtual environment.
ENV UV_SYSTEM_PYTHON=1

# Copied on its own so the dependency layer stays cached across code changes.
COPY requirements.txt .
RUN uv pip install --no-cache -r requirements.txt gunicorn

# wget syncs the NetCDF files at startup; see entrypoint.sh.
RUN apt-get update && apt-get install -y wget \
    && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 5000

RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]
