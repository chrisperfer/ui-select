# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (JS, CSS, templates `src/**/*.html`).
- Build output: `dist/` (`select(.min).js`, `select(.min).css`). Never edit `dist/`.
- Tests: `test/` (Jasmine specs) and `test/helpers.js`.
- Docs/examples: `docs/`, `examples/` (built docs in `docs-built/`).
- Module: AngularJS module `ui.select`; package entry `index.js`.

## Architecture Overview
- Core pieces: `uiSelectController`, `uiSelectDirective`, `uiSelectChoicesDirective`, `uiSelectMatchDirective`, `uiSelectMultipleDirective`, `uiSelectSingleDirective` (see files in `src/`).
- Themes: `src/bootstrap/`, `src/select2/`, `src/selectize/` provide templates compiled into the build.

## Build, Test, and Development Commands
- Install: `npm install`
- Build: `gulp build` (scripts, styles, templates, sourcemaps)
- Test: `npm test` or `gulp test` (builds, then Karma + Jasmine)
- Dev loop: `gulp watch` (rebuild + live tests)
- Docs: `gulp docs`; watch docs: `gulp docs:watch`
- Release (maintainers): `gulp bump` (semver bump, changelog, tag, push)

## Coding Style & Naming Conventions
- Indentation: 2 spaces (`.editorconfig`).
- JavaScript: single quotes; semicolons; avoid globals (build wraps in IIFE).
- Filenames: kebab-case (HTML/CSS); descriptive camelCase for JS in `src/`.
- Linting: `gulp scripts` runs JSHint and fails on errors—fix before PR.

## Testing Guidelines
- Tools: Karma + Jasmine + `angular-mocks`.
- Specs: `test/*.spec.js` (e.g., `select.controller.spec.js`).
- Run: `npm test` or `gulp test`; for TDD use `gulp watch`.
- Templates: loaded via `ng-html2js`; reference paths relative to `src/`.

## Performance Guidelines
- Avoid per-item watchers in lists; prefer `track by` and caching of `isActive`/`isDisabled` results when feasible.
- Be mindful of O(n²) checks with many selected items; recalc only when selections change.
- Consider debouncing search refreshes; heavy lists benefit from virtualization strategies.
- Multiselect model: if introducing options affecting array identity, preserve references behind an opt-in config to maintain BC (see PERFORMANCE_ANALYSIS.md).

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (Angular preset). Examples: `feat: add tagging`, `fix: dropdown scroll jitter`.
- PRs must: describe changes; link issues (`Closes #123`); include/adjust tests; update docs for user-facing changes (screenshots/GIFs for UI); avoid committing `dist/` (release-only).
