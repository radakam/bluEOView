# CEPHALOView frontend

React single-page app that renders the CEPHALOPOD projections served by the
Flask backend in [`../backend`](../backend). See the [project README](../README.md)
for the architecture and deployment instructions.

## Development

```sh
bun install          # or: npm install
npm start            # dev server on http://localhost:3000
```

`package.json` sets `"proxy": "http://127.0.0.1:5000"`, so `/api/*` requests from
the dev server reach a backend running locally on port 5000.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Development server with hot reload. |
| `npm test` | Jest test suite (`src/**/*.test.js`). |
| `npm run build` | Production bundle in `build/`, as served by nginx in the image. |

## Layout

```
src/
  api/          Calls to the backend and to the WoRMS registry
  hooks/        Data fetching and DOM measurement hooks
  components/   Components; common/ holds the shared building blocks
  styles/       Style objects shared between components
  constants.js  Colour scales, thresholds and other fixed data
  content.js    User-facing copy
  utils.js      Pure helpers for scales, legends and labels
```

Components hold markup and behaviour; anything reusable and purely visual lives
in `styles/`, and anything that talks to the network lives in `api/` and `hooks/`.
