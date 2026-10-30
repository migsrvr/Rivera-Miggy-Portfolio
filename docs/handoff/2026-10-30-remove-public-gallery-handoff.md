# Remove public Gallery — 2026-10-30

Implemented the approved plan in source and rebuilt `dist/`. Gallery is removed from the public portfolio; Practice & community retains the existing Hackathons, Leadership, and Organizations content and layout.

## Delivered

- Seven routes remain in both seed and database-backed generation. Desktop/mobile navigation, public content/counts, embedded guide JSON, and guide links omit Gallery, including when legacy callers supply Gallery data.
- Removed the Gallery grid, empty slots, lightbox renderer, client events, and dedicated styles. Photo/Gallery questions use the existing guide fallback. The Home profile photograph is retained.
- Reused builds remove the obsolete `gallery/` folder. The server rejects `/gallery`, `/gallery/`, and descendants with 404 for GET/HEAD, including encoded/case variants, older release files, fallback builds, and authenticated previews.
- Existing Gallery schemas, seed records, admin forms, APIs, and immutable release snapshots remain compatible. Gallery-only uploads are ignored for asset resolution and new build copies, so private/missing/archived Gallery-only uploads do not block publication. A shared upload referenced by Profile or another retained section still requires public approval.
- Updated affected route/guide tests, retained upload security coverage through Credentials, and preserved Gallery CRUD coverage in the PostgreSQL integration fixture. Updated current product/design/readme documentation and the sidebar component preview.

## Owned files

- Public content/rendering: `src/content.mjs`, `src/model.mjs`, `src/render.mjs`, `src/client.mjs`, `src/styles.css`, `src/assistant.mjs`.
- Build/server: `scripts/build.mjs`, `server/app.mjs`, `server/publisher.mjs`.
- Validation: `tests/gallery-removal.test.mjs`, `tests/annotations.test.mjs`, `tests/portfolio.test.mjs`, `tests/tech-experience.test.mjs`, `tests/backend/core.test.mjs`, `tests/backend/http.test.mjs`, `tests/backend/integration.test.mjs`.
- Documentation: `PRODUCT.md`, `DESIGN.md`, `README.md`, `.impeccable/design.json`, the dated Gallery-removal design/plan, and this handoff.

The coordinator completed this coupled change directly. Existing unrelated working-tree changes were preserved. The scoped before/after diff is `output/gallery-removal/changes.diff`; original working-file copies are in `/tmp/portfolio-gallery-baseline-5wh16w0i`.

## Verification

- Regression observed before implementation: Gallery-only asset resolution failed against the old publisher with an asset-missing error; the new behavior passes.
- Focused route/content/guide/build/upload/HTTP checks: **32 tests passed** with `--test-isolation=none`.
- `npm test`: **all 12 test files passed**, no skipped files or failures.
- `npm run check`: **44 JavaScript modules passed** syntax checks.
- `npm run build`: **7 pages built**, **38 local asset references verified**. No Gallery folder or Gallery references remain in generated HTML, JS, or CSS.
- Installed Chromium/Playwright checked the rebuilt files at **1440, 1024, 390, and 320px**: seven navigation destinations, no Gallery links/lightbox, keyboard community navigation, retained Leadership facts, active navigation state, mobile menu Escape/focus return, photo-question fallback, no horizontal overflow, and no browser errors. Desktop and mobile screenshots were inspected. Browser delivery used local disk interception rather than the active server release; server behavior was covered separately through Fastify injection tests.
- Scoped whitespace check passed with existing CRLF handling (`git -c core.whitespace=cr-at-eol diff --check`). All ten design component previews remain valid JSON.
- PostgreSQL integration was attempted, then retried outside the sandbox after its initial EPERM. The local test database at `127.0.0.1:55432` refused the connection (**ECONNREFUSED**); no database integration pass is claimed.

Evidence, logs, screenshots, and browser report are in `output/gallery-removal/`. The local browser runner is `.local/portfolio-gallery-browser.cjs`.

## Delivery boundary

The initial delivery changed source and rebuilt files without publication. The follow-up below completes delivery to the running local site. No database migration or content deletion, repository commit/push, or hosted deployment was performed.

## Follow-up: local site publication

The owner reported Gallery still visible and confirmed they were viewing `http://127.0.0.1:4173/`. The local server was serving the previous immutable release rather than `dist/`.

- Backed up the draft, active snapshot, and pointer in `.local/backups/gallery-release-before-2026-10-30T03-20-14.649Z.json`; confirmed the draft matched the active release before publication.
- Restarted the existing local Node server to load the updated rendering/build/server code, then verified an authenticated preview before publication.
- Published local release `0f36b45b-4ab4-49b3-8403-2733774464c9` at `2026-10-30T05:09:45.488Z`, replacing `da749b83-3db0-4bdb-8362-ce672695e23d`. The pointer and served pages were verified.
- Preserved all 32 entries, 5 assets, and 2 relationships. Temporary owner sessions were logged out.
- Verified all seven running public pages omit Gallery links and guide data. Retired Gallery URLs return 404.
- Chromium/Playwright verified the actual running local site at 1440, 1024, 390, and 320px: desktop/mobile navigation has seven destinations and no Gallery, community keyboard navigation and active states work, the guide uses its photo-question fallback, and there is no horizontal overflow or browser error.

Publication state is `.local/gallery-release-state.json`; the scoped maintenance runner is `.local/portfolio-gallery-release.mjs`. Real-server browser evidence is in `output/gallery-removal/local-publication/`. This supersedes the original build-only delivery boundary.

