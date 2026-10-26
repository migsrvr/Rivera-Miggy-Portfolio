# Portfolio Implementation Plan

> Execute within this session. The human has approved the Figma design and requested the build; do not reopen visual approval.

**Goal:** Four responsive, accessible static portfolio pages faithful to the approved design.

**Architecture:** Editable data and shared semantic templates generate full static HTML. A small browser module enhances the featured folio and shared demo player. Node built-ins provide tests, build, and local server; no production dependencies.

**Tech stack:** HTML, CSS, JavaScript ES modules, Node24.

**Spec:** `docs/superpowers/specs/2026-10-25-portfolio-design.md`.

## Contracts and ownership

- `src/content.mjs`: exports `profile`, `deployed`, `recorded`, `featured`, `experiences`, `credentials`, `routes`. Data URLs default to null where none were supplied.
- `src/media.mjs`: exports `safeExternalUrl(value)`, `videoSource(value)`, `selectProject(items,id)`. URL validation and fallback selection are independently testable.
- `src/render.mjs`: exports `renderPage(route)`, `escapeHtml(value)`, `safeJson(value)`. Shared navigation/footer/rows/project templates; no network or DOM dependency.
- `src/client.mjs`: browser enhancements for `data-folio-tab`, `data-demo-tab`, `data-play-demo`; delegates safe media handling to `media.mjs`. Keep focus stable and update ARIA. No fake playback.
- `src/styles.css`: shared visual tokens and device-responsive CSS, local font faces, focus/reduced-motion.
- `scripts/build.mjs`: copies public assets, CSS/client/media modules and emits `dist/index.html`, `dist/projects/index.html`, `dist/experience/index.html`, `dist/credentials/index.html`, `dist/404.html`.
- `scripts/dev.mjs`: local server for dist, correct MIME types/directory routing and404 behavior, path traversal protection.
- `tests/portfolio.test.mjs`: tests content inventory, all generated routes/current nav, safe links and videos, fallback selection, escaping, disabled missing links, persistent selectors.
- `public/assets/*`: exact downloaded Figma image/vector assets, font files/licenses, supplied resume. No temporary remote URLs in runtime code.
- `README.md`: start/build/edit instructions and missing-content checklist. Parent owns final verification and screenshots in outputs.

## Execution

- [x] Write the meaningful tests and run `node --test tests/portfolio.test.mjs`; observe missing module failure.
- [x] Implement data, media validation, and semantic templates to satisfy route/content/link/selection tests.
- [x] Implement minimal JS behavior and responsive CSS from the Figma contexts; preserve source image/icon geometry.
- [x] Add build/server/package commands, run tests and production build.
- [x] Start one local preview, inspect all four desktop/mobile routes, exercise selectors and navigation, fix observed defects in one batch.
- [x] Validate assets/geometry/no console errors/no320px overflow; update records and README; deliver local preview and source location.
