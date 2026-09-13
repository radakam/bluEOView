# Build with Bun's installer inside a Node image.
FROM node:22-slim AS build-stage
WORKDIR /app

RUN apt-get update && apt-get install -y curl unzip \
    && curl -fsSL https://bun.sh/install | bash \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
ENV PATH="/root/.bun/bin:$PATH"

# Copied on its own so the dependency layer stays cached across code changes.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Built with Node to avoid Bun's worker_threads limitations.
ENV CI=false
RUN npm run build

# Serve the static build with Nginx.
FROM nginx:stable-alpine
COPY --from=build-stage /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
