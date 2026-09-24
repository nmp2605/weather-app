# Boletim do Tempo

A weather monitoring dashboard built with **Vue 3**, **Tailwind CSS 4** and **Axios** on top of the
[OpenWeatherMap](https://openweathermap.org/) API. The interface is in Brazilian Portuguese and
follows Material Design 3 (color roles, shapes, elevation and state layers) with
[Heroicons](https://heroicons.com/).

- Current conditions: temperature (°C), feels-like, daily min/max and description
- Indicators: humidity with dew point, wind speed and direction, pressure, visibility and cloud cover
- Next 24 hours as a temperature curve with rain chance (3-hour steps)
- Next 5 days with min/max range bars on a shared scale
- Sunrise, sunset and the sun's position along its daily arc
- City search with autocomplete (keyboard accessible combobox)
- Starts at the browser location, then the last city viewed, then São Paulo
- Refreshes every 10 minutes while the tab is visible; light and dark themes follow the system

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuring the OpenWeatherMap key](#configuring-the-openweathermap-key)
- [Scripts](#scripts)
- [Quality gates](#quality-gates)
- [Building for production](#building-for-production)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)

## Requirements

| Tool    | Version                                                  |
| ------- | -------------------------------------------------------- |
| Node.js | `^22.18.0` or `>=24.12.0` (the repo pins 24 in `.nvmrc`) |
| npm     | 10 or newer (ships with the Node versions above)         |

An OpenWeatherMap account is also needed. The free plan covers every endpoint the app uses.

With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install
nvm use
```

## Quick start

```bash
npm ci
cp .env.example .env
# edit .env and paste your key (see below)
npm run dev
```

Open <http://localhost:5173>. Without a key the app shows a setup screen instead of data.

## Configuring the OpenWeatherMap key

1. Create a free account at <https://home.openweathermap.org/users/sign_up>.
2. Copy a key from <https://home.openweathermap.org/api_keys>. New keys can take up to a couple of
   hours to activate; until then the API answers `401` and the app shows "Chave de API inválida".
3. Put it in `.env` at the project root (git-ignored, like every `.env.*` file except `.env.example`):

   ```dotenv
   VITE_OPENWEATHER_API_KEY=your_key_here
   ```

4. Restart `npm run dev`. Vite reads environment files only on startup.

Endpoints used (all on the free plan): Current Weather (`/data/2.5/weather`), 5 day / 3 hour Forecast
(`/data/2.5/forecast`) and Geocoding (`/geo/1.0/direct`, `/geo/1.0/reverse`). Every weather call
sends `units=metric` and `lang=pt_br`.

> [!WARNING]
> Variables prefixed with `VITE_` are embedded in the JavaScript bundle, so anyone who opens the
> deployed site can read the key. That is acceptable for a personal dashboard or a demo. For a
> public deployment, route requests through a small backend or edge function that adds the key
> server-side, and point `OPENWEATHER_BASE_URL` in `src/api/client.ts` at it.

## Scripts

| Command                 | What it does                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run dev`           | Development server with hot reload on port 5173                           |
| `npm run build`         | Type-checks, then builds the production bundle into `dist/`               |
| `npm run preview`       | Serves `dist/` locally to test the production build                       |
| `npm test`              | Runs the test suite once                                                  |
| `npm run test:watch`    | Runs tests in watch mode                                                  |
| `npm run test:coverage` | Runs tests with coverage and fails below 90%                              |
| `npm run lint`          | Oxlint + ESLint (Vue, TypeScript, SonarJS, Vitest rules) + Prettier check |
| `npm run lint:fix`      | Applies automatic lint and formatting fixes                               |
| `npm run format`        | Formats every file with Prettier                                          |
| `npm run type-check`    | Strict TypeScript check of app, tests and config (`vue-tsc`)              |
| `npm run analyze`       | Static analysis: `type-check` + Knip (unused files, exports, deps)        |
| `npm run check`         | Everything CI runs: lint, analyze, coverage and production build          |

## Quality gates

Run the whole pipeline locally before pushing:

```bash
npm run check
```

It runs these tools. [CI](.github/workflows/ci.yml) runs the same command on Node 22 and 24.

| Gate            | Tooling                                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tests           | [Vitest](https://vitest.dev/) + [Vue Test Utils](https://test-utils.vuejs.org/) in jsdom; HTTP mocked with `axios-mock-adapter`                                                                                                                        |
| Coverage        | V8 coverage with a **90% minimum** for statements, branches, functions and lines (`vitest.config.ts`)                                                                                                                                                  |
| Linting         | [Oxlint](https://oxc.rs/docs/guide/usage/linter), [ESLint](https://eslint.org/) with `eslint-plugin-vue`, type-aware `typescript-eslint` and `@vitest/eslint-plugin`                                                                                   |
| Static analysis | [SonarJS](https://github.com/SonarSource/SonarJS/tree/master/packages/jsts/src/rules) rules (bugs, code smells, complexity), `vue-tsc` in strict mode with `noUncheckedIndexedAccess`, [Knip](https://knip.dev/) for dead code and unused dependencies |
| Formatting      | [Prettier](https://prettier.io/) with `prettier-plugin-tailwindcss` (sorted class lists)                                                                                                                                                               |

### Coverage report

`npm run test:coverage` prints a summary and writes the full report to `coverage/`:

- `coverage/index.html`: browsable report, file by file
- `coverage/coverage-summary.json`: machine-readable totals
- `coverage/lcov.info`: for Codecov, SonarQube and similar tools

Latest run (187 tests in 23 files):

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 100%       | 98.65%   | 99.35%    | 100%  |

## Building for production

```bash
npm run build
npm run preview
```

`dist/` is a static site: deploy it to any static host (Netlify, Vercel, Cloudflare Pages, GitHub
Pages, S3 + CloudFront). Set `VITE_OPENWEATHER_API_KEY` in the host's build environment, because the
value is read at build time. Serve the site over **HTTPS**: browsers only allow geolocation on
secure origins (`localhost` counts as secure during development).

## Project structure

```text
src/
├── api/            # HTTP layer: Axios client, OpenWeatherMap endpoints, raw types, error mapping
├── components/     # Vue single-file components (presentational, typed props/emits)
├── composables/    # Reactive state: weather loading, city search, clock, auto refresh
├── config/         # Environment access, constants, Portuguese UI messages
├── domain/         # App types and mappers from API payloads to view models
├── services/       # Use cases: weather report, geolocation, saved city, initial location
├── utils/          # Pure helpers: time zones, number formatting, sun arc geometry
├── assets/main.css # Tailwind entry point and Material 3 design tokens (light and dark)
├── App.vue         # Page composition and state orchestration
└── main.ts         # Bootstrap
```

Tests live next to the code they cover in `__tests__/` folders. Shared fixtures and browser API
doubles are in `src/__tests__/`. `prototype/index.html` is the approved static HTML prototype the
app was built from.

## How it works

**Data flow.** Components never call the API. `App.vue` uses `useWeather()`, which calls
`services/weatherService.ts`. That service fetches current weather and forecast in parallel through
`api/openWeather.ts` and maps them into a `WeatherReport` (`domain/mappers.ts`). Each new request
aborts the previous one, so a slow response can never replace a newer choice.

**Time zones.** OpenWeatherMap returns Unix timestamps plus the city's UTC offset. Every clock
shown (local time, hours, weekdays, sunrise/sunset) is the city's own time, whatever time zone the
viewer is in.

**First city.** `services/initialLocation.ts` picks, in order:

1. the browser location, if permission was already granted;
2. the last city viewed (stored in `localStorage`);
3. the browser location after asking for permission (first visit, 8-second limit);
4. São Paulo, with a notice explaining why.

The location button in the search bar switches back to the browser location at any time.

**Icons.** Heroicons has no rain, snow or fog glyphs, so conditions map to the closest metaphors:
`sun`/`moon` (clear), `cloud`, `cloud-arrow-down` (rain and drizzle), `bolt` (thunderstorm),
`sparkles` (snow) and `eye-slash` (mist and fog).

## Troubleshooting

| Symptom                                      | Fix                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Configure a chave da OpenWeatherMap" screen | Add `VITE_OPENWEATHER_API_KEY` to `.env` and restart the dev server.                                                                                |
| "Chave de API inválida"                      | Check the key; new keys can take a couple of hours to activate.                                                                                     |
| "Limite de requisições atingido"             | The free plan allows 60 calls/minute and 1,000,000/month; wait a moment.                                                                            |
| Location never used                          | Allow location for the site in the browser, and serve over HTTPS outside `localhost`.                                                               |
| `SyntaxError ... styleText` when starting    | Node is too old; run `nvm use` (see [Requirements](#requirements)).                                                                                 |
| Tests fail with `localStorage` undefined     | Node 25+ ships its own `localStorage`; `vitest.config.ts` disables it with `--no-experimental-webstorage`. Keep that flag if you change the config. |
