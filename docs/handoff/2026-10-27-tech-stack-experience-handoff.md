# Tech-stack icons and plain Experience rows — 2026-10-27

Implemented the supplied plan and published locally. This supersedes the public detail-page and public relationship behavior in earlier handoffs. Existing unrelated working-tree edits, including profile and gallery content, were preserved. No database migration, owner API change, commit, repository push, or hosted deployment was performed.

## Delivered behavior

- Added locally hosted Simple Icons SVGs for React, Railway, Next.js, TypeScript, and Google Gemini. Source and existing CC0 license are in `public/assets/tech/`. Tesseract.js, pgvector, and Groq use monochrome OCR, PGV, and GQ text badges. All 16 current technologies have a shared 28px icon area with existing labels, order, white styling, and responsive wrapping. Lookup ignores capitalization and surrounding whitespace; unknown tools keep their text labels.
- Freelance uses `/assets/favicon.svg`, the existing MR mark, in the seed and Neon draft, with the shared 44px organization-logo presentation.
- Home and Experience use plain reading rows without row anchors, arrows, hover links, or interactive focus states. Navigation and View all still open `/experience/`. Supplied roles, organizations, periods, work context, logos, and descriptions remain on the Experience list and in guide data/answers.
- Removed the six individual detail routes and renderer, leaving eight public routes. Rebuilds remove obsolete generated Experience subfolders. The server returns 404 for retired URLs in public releases and authenticated previews, including older release files, direct index paths, and encoded paths.
- Removed deployed/recorded project-to-experience links and the matching client code/CSS. Public content and embedded JSON omit relationships, experience `projectIds`/`sampleConnections`, and recorded `experienceLinks`. The original three relationships and all authenticated admin editing controls remain intact. Supplied descriptive prose remains public as approved.

Implementation is in `src/activity.mjs`, `src/content.mjs`, `src/model.mjs`, `src/render.mjs`, `src/client.mjs`, `src/styles.css`, `src/assistant.mjs`, `scripts/build.mjs`, and `server/app.mjs`; affected tests and current product/design/readme documentation were updated.

## Backup and publication

- Draft backup: `.local/backups/tech-experience-before-2026-10-27T05-39-26.741Z.json`.
- Exact prior pointer backup: `.local/backups/tech-experience-active-before-2026-10-27T05-39-26.741Z.json`.
- Previous active release: `a7cff50d-7dee-4630-b08d-ab9f45bacadd`.
- New active release: `09337171-ac79-4ae7-aaf8-e21d31282212`.
- Published: `2026-10-27T05:55:26.553Z`.
- Operation record: `.local/tech-experience-update-state.json`.
- Scoped maintenance script: `.local/portfolio-tech-experience-sync.mjs`.

The draft matched the active snapshot before the change. One transaction updated only the freelance logo, with full preservation assertions covering all other fields in 32 entries, all five asset records, and all three relationship records. The Windows local server was restarted successfully. An authenticated preview was verified before publication. Publication completed with a ready release, the expected active pointer, the preserved content snapshot, and captured GitHub activity. Temporary owner sessions were logged out.

## Verification completed before the owner stopped further testing

- Regression tests first failed against the previous implementation, then passed for icon coverage/normalization, plain rows and retained facts, public JSON omission, fresh/reused builds, obsolete-folder cleanup, and 404 behavior against older releases and authenticated previews.
- Focused content, Experience, portfolio, Home activity, build, and HTTP checks passed.
- Full suite: 59/60 individual tests passed (10/11 files under `npm test`). The sole failure is the existing gallery baseline: `tests/annotations.test.mjs` expects a stage-photo lightbox and four gallery entries, while the current seed intentionally has three empty slots. This failure was reproduced before implementation; the gallery assertions and content were preserved.
- Syntax check passed for 42 modules. Build passed with eight pages and 33 verified local asset references.
- Authenticated preview checked all eight routes, six non-interactive Experience rows, all 16 technology marks/labels, 14 SVG responses against original asset bytes, guide facts, deployed website/code links, recorded selector markup, and retired detail/index URLs returning 404.
- Database integration was attempted, but local PostgreSQL at `127.0.0.1:55432` was unavailable (connection refused after allowing sandbox network access). No database integration pass is claimed.
- The owner explicitly requested stopping further test runs. The prepared Playwright workflow was not run; desktop/mobile visual alignment, wrapping, and live browser interaction checks are not claimed. Publication used the completed authenticated preview and preserved-snapshot checks without rerunning page checks. Post-publication status and active pointer were confirmed; an additional public browser sweep was omitted at the owner's request.
