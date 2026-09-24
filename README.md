# Boletim do Tempo

Weather monitoring dashboard built with Vue 3, Tailwind CSS 4 and Axios, using the
[OpenWeatherMap](https://openweathermap.org/) API. The interface is in Brazilian Portuguese.

## Requirements

- Node.js `^22.18.0` or `>=24.12.0` (`.nvmrc` pins 24)
- A free OpenWeatherMap account

```bash
nvm install
nvm use
```

## Setup

```bash
npm ci
cp .env.example .env
```

1. Create an account at <https://home.openweathermap.org/users/sign_up>.
2. Copy a key from <https://home.openweathermap.org/api_keys> (new keys can take a couple of hours
   to activate).
3. Add it to `.env`:

   ```dotenv
   VITE_OPENWEATHER_API_KEY=your_key_here
   ```

4. Start the dev server and open <http://localhost:5173>:

   ```bash
   npm run dev
   ```

> [!WARNING]
> `VITE_` variables are embedded in the bundle, so the key is visible to anyone using the deployed
> site. For a public deployment, proxy the API through a backend that adds the key.

## Scripts

| Command                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Development server                                  |
| `npm run build`         | Type-check and build to `dist/`                     |
| `npm run preview`       | Serve the production build                          |
| `npm test`              | Run the tests                                       |
| `npm run test:watch`    | Run the tests in watch mode                         |
| `npm run test:coverage` | Run the tests with coverage (fails below 90%)       |
| `npm run lint`          | Oxlint, ESLint (with SonarJS) and Prettier check    |
| `npm run lint:fix`      | Fix lint and formatting issues                      |
| `npm run format`        | Format with Prettier                                |
| `npm run type-check`    | Type-check with `vue-tsc`                           |
| `npm run analyze`       | Static analysis: type-check and Knip                |
| `npm run check`         | Lint, analyze, test with coverage and build (as CI) |

## Quality checks

```bash
npm run check
```

[CI](.github/workflows/ci.yml) runs the same command on Node 22 and 24. The coverage report is
written to `coverage/index.html`.

Latest coverage (191 tests):

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 100%       | 98.67%   | 99.35%    | 100%  |

## Production build

```bash
npm run build
```

Deploy `dist/` to any static host. Set `VITE_OPENWEATHER_API_KEY` in the build environment and
serve over HTTPS (required for browser geolocation).

## Project structure

```text
src/
├── api/          # OpenWeatherMap client and endpoints
├── components/   # Vue components
├── composables/  # Reactive state
├── config/       # Environment, constants and UI messages
├── domain/       # Types and API-to-view mappers
├── services/     # Weather, geolocation and saved location
├── utils/        # Formatting and time helpers
├── assets/       # Tailwind entry and design tokens
├── App.vue
└── main.ts
```

Tests live in `__tests__/` folders next to the code. `prototype/index.html` is the static HTML
prototype.

## Troubleshooting

| Symptom                                      | Fix                                                      |
| -------------------------------------------- | -------------------------------------------------------- |
| "Configure a chave da OpenWeatherMap" screen | Add the key to `.env` and restart the dev server.        |
| "Chave de API inválida"                      | Check the key or wait for it to activate.                |
| "Limite de requisições atingido"             | Wait a minute; the free plan allows 60 calls per minute. |
| Location is never used                       | Allow location access and serve over HTTPS.              |
| `SyntaxError ... styleText` on start         | Node is too old; run `nvm use`.                          |
