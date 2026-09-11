# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Vite/React front end at the root and additional app packages under `apps/`. Root application code lives in `src/`, with route definitions in `src/router/` and `src/routes/`, reusable UI in `src/components/`, shared business logic in `src/shared/`, page/app modules in `src/apps/`, and static files in `public/assets/`. Tests are in `tests/`, including Playwright UI specs under `tests/ui/`. The API package lives in `apps/shs-api/` with TypeScript source in `src/`, migrations in `migrations/`, seeds in `seeds/`, and API tests in `tests/`.

## Build, Test, and Development Commands

- `npm run dev`: validates manifests/UI contracts, then starts the root Vite app.
- `npm run build`: validates manifests and builds all configured Vite entry points.
- `npm run preview`: serves the built root app on port `5174`.
- `npm run ci:ui`: runs manifest validation, UI contract validation, style checks, and app registry snapshots.
- `playwright test tests/ui/<name>.spec.mjs`: runs one focused UI spec.
- `cd apps/shs-api && npm run dev`: starts the API in watch mode.
- `cd apps/shs-api && npm test`: runs TypeScript API tests with Node's test runner.

## Coding Style & Naming Conventions

Use ES modules throughout. React components use `PascalCase` filenames with `.jsx`; shared utilities use `camelCase` `.js` or `.ts` files. Prefer existing aliases such as `@/` from `vite.config.js`. Follow the ESLint flat config in `eslint.config.js`: browser globals, recommended JS rules, React Hooks rules, React Refresh rules, and no unused variables unless intentionally named with an uppercase/underscore pattern. Match the surrounding indentation and quote style in touched files.

## Testing Guidelines

Add or update the narrowest test that proves the behavior. Root UI and integration tests use Playwright and `.spec.mjs` naming. Root review/contract tests commonly use `.test.mjs`; API tests use `.test.ts` under `apps/shs-api/tests/`. Run manifest validation before root tests through `npm run pretest` or the relevant npm script.

## Commit & Pull Request Guidelines

Recent history uses concise subjects such as `feat(studio): ...`, `restore(sales): ...`, `governance(...): ...`, and checkpoint commits. Use an imperative, scoped subject when possible. Pull requests should describe the changed surface, list verification commands run, call out migrations or config changes, link issues when available, and include screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit secrets, generated caches, or local backups. API database work should use the migration commands in `apps/shs-api` and document any required environment variables in the PR.
