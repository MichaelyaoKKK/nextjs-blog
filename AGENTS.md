# Repository Guidelines

## Project Structure & Module Organization

This is a personal showcase website for a 12-year-old girl, featuring her drawings and everyday life. Use a predictable layout:

- `src/` for application source code, grouped by feature or module.
- `tests/` for automated tests that mirror the relevant `src/` paths.
- `assets/` for static images, fonts, and other checked-in resources.
- `docs/` for design notes, setup guidance, and architectural decisions.

Do not commit generated output, dependencies, local environment files, or credentials; add them to `.gitignore`.

## Build, Test, and Development Commands

No build system has been selected yet. Document canonical, reproducible commands in `README.md` once one is added. A Node project would use:

```sh
npm install       # install dependencies
npm run dev       # run the local development server
npm test          # execute the test suite
npm run build     # create a production build
```

Avoid globally installed tools unless documented.

## Coding Style & Naming Conventions

Use the chosen formatter and linter. Prefer 2 spaces for JSON, YAML, JavaScript, and TypeScript unless the formatter specifies otherwise. Use `kebab-case` for files/directories, `PascalCase` for components/classes, and `camelCase` for functions/variables. Keep modules focused.

Design the site to be clean, simple, and cute, with an age-appropriate style that feels personal and cheerful. Prioritize readable copy, calm layouts, friendly colors, and easy navigation over visual complexity.

## Testing Guidelines

Add tests for each feature and mirror source paths where practical; for example, `src/cart/total.ts` has `tests/cart/total.test.ts`. Name tests by behavior, such as `returns zero for an empty cart`. Run tests and linting before a pull request. Define coverage targets when a framework is chosen.

## Commit & Pull Request Guidelines

There is no commit history yet; use concise imperative commits such as `feat: add landing page` or `fix: handle empty cart`. Keep commits focused. Pull requests should explain the change, link issues when applicable, list verification, and include screenshots for UI changes. Request review only after local checks pass.

Create a corresponding Git commit after every completed change so work is easy to trace and revert. Each change must include new or updated relevant tests, and all tests and applicable validation must pass before delivery. Ask the user for approval before any action that incurs a cost, including paid services, subscriptions, or purchases.
